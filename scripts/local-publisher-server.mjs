#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import chokidar from "chokidar";
import {
  getGitInfo,
  loadDotEnvLocal,
  POST_FILENAME_RE,
  publishObsidianPosts,
  resolveSourcePost,
  scanObsidianPosts,
  unpublishPosts,
  validateObsidianPost,
} from "./lib/obsidian-publisher.mjs";

const PROJECT_ROOT = process.cwd();
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4789;
const DEFAULT_TOKEN = "change-this-local-token";
const POST_FILENAME_HELP =
  "文件名必须是 YYYY-MM-DD-title.md；title 部分可使用中英文、数字、空格、下划线和连字符。";

const state = {
  posts: [],
  lastScanAt: null,
  watcherReady: false,
  lastLogs: [],
  lastError: "",
};

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  state.lastLogs.push(line);
  state.lastLogs = state.lastLogs.slice(-500);
  console.log(line);
}

function redactUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.slice(0, 12)}...`;
  } catch {
    return "[configured]";
  }
}

function config() {
  return {
    host: process.env.LOCAL_PUBLISHER_HOST || DEFAULT_HOST,
    port: Number(process.env.LOCAL_PUBLISHER_PORT || DEFAULT_PORT),
    token: process.env.LOCAL_PUBLISHER_TOKEN || DEFAULT_TOKEN,
    obsidianVaultPath: process.env.OBSIDIAN_VAULT_PATH || "",
    obsidianPostsDir: process.env.OBSIDIAN_POSTS_DIR || "",
    obsidianImageDirs: process.env.OBSIDIAN_IMAGE_DIRS || "",
    deployHookUrl: process.env.VERCEL_DEPLOY_HOOK_URL || "",
    projectRoot: PROJECT_ROOT,
  };
}

function json(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function html(res, body) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function notFound(res) {
  json(res, 404, { error: "Not found" });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON request body"));
      }
    });
    req.on("error", reject);
  });
}

function tokenFrom(req, url) {
  return (
    req.headers["x-publisher-token"] || req.headers.authorization?.replace(/^Bearer\s+/i, "") || ""
  );
}

function requireToken(req, res, url) {
  const expected = config().token;
  if (expected === DEFAULT_TOKEN && req.method !== "GET") {
    json(res, 403, {
      error:
        "LOCAL_PUBLISHER_TOKEN 仍是示例默认值。请在 .env.local 中改成自定义 token，重启 publisher，并在页面右上角输入同一个 token。",
    });
    return false;
  }
  if (tokenFrom(req, url) !== expected) {
    json(res, 401, {
      error:
        "访问令牌不正确。请确认页面右上角输入的 token 与 .env.local 中的 LOCAL_PUBLISHER_TOKEN 完全一致。",
    });
    return false;
  }
  return true;
}

function filterPosts(posts, url) {
  const status = url.searchParams.get("status") || "all";
  const tag = url.searchParams.get("tag") || "";
  const search = (url.searchParams.get("search") || "").toLowerCase();

  return posts.filter((post) => {
    if (status !== "all" && post.status !== status) return false;
    if (tag && !post.tags.includes(tag)) return false;
    if (search) {
      const hay =
        `${post.title} ${post.titleEn ?? ""} ${post.fileName} ${post.slug} ${post.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

async function refreshScan() {
  const cfg = config();
  try {
    state.posts = await scanObsidianPosts(cfg);
    state.lastScanAt = new Date().toISOString();
    state.lastError = "";
    log(`scan_completed: ${state.posts.length} posts`);
  } catch (error) {
    state.posts = [];
    state.lastScanAt = new Date().toISOString();
    state.lastError = error instanceof Error ? error.message : String(error);
    log(`scan_failed: ${state.lastError}`);
  }
  return state.posts;
}

function statusPayload() {
  let git = { branch: "unknown", status: "", remote: "" };
  try {
    git = getGitInfo({ projectRoot: PROJECT_ROOT });
  } catch (error) {
    log(`git_status_warning: ${error instanceof Error ? error.message : String(error)}`);
  }

  const cfg = config();
  return {
    obsidianPostsDir: cfg.obsidianPostsDir,
    obsidianImageDirs: cfg.obsidianImageDirs,
    blogPostsDir: path.join(PROJECT_ROOT, "src", "content", "posts"),
    gitBranch: git.branch,
    gitRemote: git.remote,
    gitStatusSummary: git.status,
    hasUnrelatedChanges: Boolean(git.status.trim()),
    tokenUsesDefault: cfg.token === DEFAULT_TOKEN,
    lastScanAt: state.lastScanAt,
    watcherReady: state.watcherReady,
    projectRoot: PROJECT_ROOT,
    host: cfg.host,
    port: cfg.port,
    deployHookConfigured: Boolean(cfg.deployHookUrl),
    deployHookPreview: redactUrl(cfg.deployHookUrl),
    lastError: state.lastError,
  };
}

async function resolveSelectedFiles(files) {
  const cfg = config();
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("files must be a non-empty array");
  }
  return Promise.all(
    files.map(async (fileName) => {
      if (typeof fileName !== "string" || !POST_FILENAME_RE.test(fileName)) {
        throw new Error(`${POST_FILENAME_HELP} 当前值：${fileName}`);
      }
      if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
        throw new Error(`文件名不能包含路径分隔符或 ..：${fileName}`);
      }
      return (await resolveSourcePost(fileName, cfg)).sourcePath;
    }),
  );
}

function validatePostFileNames(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("files must be a non-empty array");
  }
  return files.map((fileName) => {
    if (typeof fileName !== "string" || !POST_FILENAME_RE.test(fileName)) {
      throw new Error(`${POST_FILENAME_HELP} 当前值：${fileName}`);
    }
    if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
      throw new Error(`文件名不能包含路径分隔符或 ..：${fileName}`);
    }
    return fileName;
  });
}

async function validateFiles(files) {
  const cfg = config();
  const fileNames = validatePostFileNames(files);
  const results = [];
  for (const fileName of fileNames) {
    let sourcePath;
    try {
      sourcePath = (await resolveSourcePost(fileName, cfg)).sourcePath;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        fileName,
        valid: false,
        errors: [message],
        warnings: [],
      });
      continue;
    }

    const validation = await validateObsidianPost(sourcePath, cfg);
    const scanPost = state.posts.find((post) => post.absolutePath === sourcePath);
    const errors = [...validation.errors];
    const warnings = [...validation.warnings];
    if (scanPost?.draft) errors.push("draft: true posts cannot be published");
    if (scanPost && scanPost.publish !== true)
      errors.push("publish must be true before publishing");
    results.push({
      fileName: path.basename(sourcePath),
      valid: errors.length === 0,
      errors,
      warnings,
    });
  }
  return results;
}

async function handlePublish(req, res) {
  const body = await readBody(req);
  const files = body.files ?? [];
  const dryRun = body.dryRun === true;
  const commit = body.commit === true;
  const push = body.push === true;
  const commitMessage =
    typeof body.commitMessage === "string" && body.commitMessage.trim()
      ? body.commitMessage.trim()
      : `publish: batch posts ${new Date().toISOString().slice(0, 10)}`;

  log(`publish_started: ${files.length} file(s), dryRun=${dryRun}, commit=${commit}, push=${push}`);
  const validations = await validateFiles(files);
  const invalid = validations.filter((item) => !item.valid);
  if (invalid.length > 0) {
    log("publish_failed: validation failed");
    return json(res, 400, { error: "Validation failed", validations, logs: state.lastLogs });
  }

  const sourcePaths = await resolveSelectedFiles(files);
  try {
    const result = await publishObsidianPosts(sourcePaths, {
      ...config(),
      dryRun,
      commit,
      push,
      commitMessage,
      logger: log,
    });
    await refreshScan();
    log(`publish_completed: ${files.join(", ")}`);
    return json(res, 200, { ok: true, result, validations, logs: state.lastLogs });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`publish_failed: ${message}`);
    return json(res, 500, { error: message, validations, logs: state.lastLogs });
  }
}

async function handleUnpublish(req, res) {
  const body = await readBody(req);
  const files = validatePostFileNames(body.files ?? []);
  const mode = body.mode === "hard" ? "hard" : "soft";
  const commit = body.commit === true;
  const push = body.push === true;
  const dryRun = body.dryRun === true;
  const deleteObsidianSource = body.deleteObsidianSource === true;
  const commitMessage =
    typeof body.commitMessage === "string" && body.commitMessage.trim()
      ? body.commitMessage.trim()
      : mode === "soft" && files.length === 1
        ? `unpublish: ${files[0].replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "")}`
        : mode === "hard" && files.length === 1
          ? `remove post: ${files[0].replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "")}`
          : `${mode === "soft" ? "unpublish" : "remove posts"}: batch posts ${new Date().toISOString().slice(0, 10)}`;

  log(`unpublish_started: ${files.length} file(s), mode=${mode}, commit=${commit}, push=${push}`);
  try {
    const result = await unpublishPosts(files, {
      ...config(),
      mode,
      dryRun,
      commit,
      push,
      commitMessage,
      deleteObsidianSource,
      logger: log,
    });
    await refreshScan();
    log(`unpublish_completed: ${files.join(", ")}`);
    return json(res, 200, { ok: true, result, logs: state.lastLogs });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`unpublish_failed: ${message}`);
    return json(res, 500, { error: message, logs: state.lastLogs });
  }
}

async function triggerDeployHook(res) {
  const cfg = config();
  if (!cfg.deployHookUrl) {
    return json(res, 400, { error: "VERCEL_DEPLOY_HOOK_URL is not configured" });
  }
  try {
    log(`deploy_hook_started: ${redactUrl(cfg.deployHookUrl)}`);
    const response = await fetch(cfg.deployHookUrl, { method: "POST" });
    log(`deploy_hook_completed: status ${response.status}`);
    return json(res, 200, { ok: response.ok, status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`deploy_hook_failed: ${message}`);
    return json(res, 500, { error: message });
  }
}

async function handleApi(req, res, url) {
  if (!requireToken(req, res, url)) return;

  try {
    if (req.method === "GET" && url.pathname === "/api/posts") {
      return json(res, 200, { posts: filterPosts(state.posts, url) });
    }
    if (req.method === "GET" && url.pathname === "/api/status") {
      return json(res, 200, statusPayload());
    }
    if (req.method === "GET" && url.pathname === "/api/logs") {
      return json(res, 200, { logs: state.lastLogs });
    }
    if (req.method === "POST" && url.pathname === "/api/refresh") {
      const posts = await refreshScan();
      return json(res, 200, { posts, status: statusPayload() });
    }
    if (req.method === "POST" && url.pathname === "/api/validate") {
      const body = await readBody(req);
      const validations = await validateFiles(body.files ?? []);
      return json(res, 200, { validations });
    }
    if (req.method === "POST" && url.pathname === "/api/publish") {
      return handlePublish(req, res);
    }
    if (req.method === "POST" && url.pathname === "/api/unpublish") {
      return handleUnpublish(req, res);
    }
    if (req.method === "POST" && url.pathname === "/api/deploy-hook") {
      return triggerDeployHook(res);
    }
    return notFound(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`api_error: ${message}`);
    return json(res, 500, { error: message });
  }
}

function dashboardHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Obsidian 博客发布面板</title>
  <style>
    :root { color-scheme: light; --bg:#f7f4ee; --panel:#fffdf8; --ink:#211f1c; --muted:#6d665d; --border:#ded6ca; --accent:#2f5d50; --danger:#9b2c2c; --warn:#8a5a00; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:var(--bg); color:var(--ink); }
    header { position:sticky; top:0; z-index:2; border-bottom:1px solid var(--border); background:rgba(247,244,238,.92); backdrop-filter: blur(12px); }
    .wrap { max-width:1280px; margin:0 auto; padding:18px 22px; }
    h1 { margin:0; font-family: Georgia, serif; font-weight:500; font-size:28px; }
    .top { display:flex; align-items:center; justify-content:space-between; gap:18px; }
    .token { display:flex; gap:8px; align-items:center; color:var(--muted); font-size:13px; }
    input, select, button, textarea { font:inherit; }
    input, select { border:1px solid var(--border); border-radius:7px; background:var(--panel); color:var(--ink); padding:8px 10px; }
    button { border:1px solid var(--border); border-radius:7px; background:var(--panel); color:var(--ink); padding:8px 11px; cursor:pointer; }
    button.primary { background:var(--ink); color:white; border-color:var(--ink); }
    button.danger { background:var(--danger); color:white; border-color:var(--danger); }
    button:disabled { opacity:.5; cursor:not-allowed; }
    .grid { display:grid; gap:14px; }
    .status { grid-template-columns: repeat(5, minmax(0,1fr)); margin-top:16px; }
    .card { border:1px solid var(--border); background:var(--panel); border-radius:8px; padding:13px; min-width:0; }
    .label { color:var(--muted); font-size:11px; letter-spacing:.12em; text-transform:uppercase; }
    .value { margin-top:5px; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .toolbar { display:flex; flex-wrap:wrap; gap:9px; align-items:center; margin-top:16px; }
    table { width:100%; border-collapse:collapse; margin-top:16px; background:var(--panel); border:1px solid var(--border); }
    th, td { padding:10px; border-bottom:1px solid var(--border); text-align:left; vertical-align:top; font-size:13px; }
    th { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.1em; background:#f1ece4; }
    tr:hover td { background:#fbf8f1; }
    .badge { display:inline-flex; align-items:center; border-radius:999px; padding:2px 8px; font-size:11px; border:1px solid var(--border); color:var(--muted); }
    .new,.changed { color:var(--accent); border-color:#97b7aa; }
    .invalid,.error,.missing_assets { color:var(--danger); border-color:#d8a2a2; }
    .draft,.not_publishable { color:var(--warn); border-color:#e0c17b; }
    .published { color:#4f6f46; border-color:#a9c49c; }
    .unpublished,.orphaned_published { color:#5a4e85; border-color:#b8addd; }
    .actions { display:flex; flex-wrap:wrap; gap:5px; margin-top:7px; }
    .actions button { padding:4px 7px; font-size:11px; }
    .tags { display:flex; flex-wrap:wrap; gap:4px; }
    .small { color:var(--muted); font-size:12px; }
    .messages { color:var(--danger); margin-top:4px; }
    .warnings { color:var(--warn); margin-top:4px; }
    .log { margin-top:16px; min-height:180px; max-height:320px; overflow:auto; background:#171512; color:#f4efe5; border-radius:8px; padding:12px; white-space:pre-wrap; font:12px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; }
    @media (max-width: 900px) { .status { grid-template-columns:1fr; } .top { align-items:flex-start; flex-direction:column; } table { display:block; overflow-x:auto; } }
  </style>
</head>
<body>
  <header>
    <div class="wrap top">
      <div>
        <h1>Obsidian 博客发布面板</h1>
        <div class="small">仅本地使用 · 127.0.0.1 · 基于 Git 的发布流程</div>
      </div>
      <label class="token">访问令牌 <input id="token" type="password" placeholder="LOCAL_PUBLISHER_TOKEN" /></label>
    </div>
  </header>
  <main class="wrap">
    <section id="status" class="grid status"></section>
    <section class="toolbar">
      <select id="statusFilter">
        <option value="all">全部状态</option><option value="new">新文章</option><option value="changed">已变更</option><option value="draft">草稿</option><option value="invalid">校验失败</option><option value="published">已发布</option><option value="unpublished">已撤下</option><option value="orphaned_published">仅发布副本</option><option value="missing_assets">资源缺失</option><option value="not_publishable">不可发布</option><option value="error">错误</option>
      </select>
      <input id="search" placeholder="搜索标题、英文标题、文件名、标签" />
      <button id="refresh">刷新</button>
      <button id="validate">校验所选</button>
      <button id="dryrun">试运行所选</button>
      <button id="publish" class="primary">发布所选</button>
      <button id="push" class="danger">发布 + 提交 + 推送</button>
      <button id="softUnpublish">软撤下所选</button>
      <button id="hardUnpublish" class="danger">硬撤下所选</button>
      <button id="deploy">触发部署 Hook</button>
    </section>
    <table>
      <thead><tr><th><input type="checkbox" id="selectAll" /></th><th>文章</th><th>日期 / Slug</th><th>标签</th><th>状态</th><th>发布副本</th><th>修改时间</th><th>消息</th></tr></thead>
      <tbody id="rows"></tbody>
    </table>
    <section class="log" id="log">等待本地发布服务...</section>
  </main>
  <script>
    const els = {
      token: document.querySelector('#token'), status: document.querySelector('#status'), rows: document.querySelector('#rows'),
      statusFilter: document.querySelector('#statusFilter'), search: document.querySelector('#search'), log: document.querySelector('#log'),
      selectAll: document.querySelector('#selectAll')
    };
    let posts = [];
    const statusLabels = {
      all: '全部状态', new: '新文章', changed: '已变更', draft: '草稿', invalid: '校验失败',
      published: '已发布', unpublished: '已撤下', orphaned_published: '仅发布副本',
      missing_assets: '资源缺失', not_publishable: '不可发布', error: '错误', missing: '缺失'
    };
    const copyLabels = { published: '已发布', draft: '草稿', missing: '缺失', deleted: '已删除', changed: '已变更', unpublished: '已撤下', missing_assets: '资源缺失' };
    els.token.value = localStorage.getItem('publisherToken') || '${DEFAULT_TOKEN}';
    els.token.addEventListener('change', () => { localStorage.setItem('publisherToken', els.token.value); loadAll(); });
    function token() { return els.token.value; }
    async function api(path, opts = {}) {
      const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', 'X-Publisher-Token': token(), ...(opts.headers || {}) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    }
    function selectedFiles() { return [...document.querySelectorAll('.pick:checked')].map(i => i.value); }
    function setLog(lines) { els.log.textContent = Array.isArray(lines) ? lines.join('\\n') : String(lines || ''); els.log.scrollTop = els.log.scrollHeight; }
    function renderStatus(s) {
      const items = [
        ['Obsidian Blog', s.obsidianPostsDir || '未配置'], ['Git 分支', s.gitBranch + (s.gitBranch !== 'main' ? ' · 非 main' : '')],
        ['Git 状态', s.gitStatusSummary ? '有未提交变更' : '干净'], ['监听器', s.watcherReady ? '已就绪' : '未就绪'],
        ['访问令牌', s.tokenUsesDefault ? '仍是示例默认值，写操作已禁用' : '已自定义'],
        ['上次扫描', s.lastScanAt || '从未扫描'], ['项目目录', s.projectRoot], ['博客发布目录', s.blogPostsDir], ['远端仓库', s.gitRemote || '无'],
        ['部署 Hook', s.deployHookConfigured ? '已配置' : '未配置'], ['最近错误', s.lastError || '无']
      ];
      els.status.innerHTML = items.map(([k,v]) => '<div class="card"><div class="label">'+k+'</div><div class="value" title="'+String(v).replaceAll('"','&quot;')+'">'+v+'</div></div>').join('');
    }
    function renderRows() {
      const status = els.statusFilter.value, q = els.search.value.toLowerCase();
      const filtered = posts.filter(p => (status === 'all' || p.status === status) && (!q || (p.title + ' ' + (p.titleEn || '') + ' ' + p.fileName + ' ' + p.tags.join(' ')).toLowerCase().includes(q)));
      els.rows.innerHTML = filtered.map(p => '<tr><td><input class="pick" type="checkbox" value="'+p.fileName+'"></td><td><strong>'+escapeHtml(p.title || '(未命名)')+'</strong>'+(p.titleEn ? '<div class="small">'+escapeHtml(p.titleEn)+'</div>' : '')+'<div class="small">'+p.fileName+'</div><div class="small">'+escapeHtml(p.description || '')+'</div><div class="actions"><button data-soft="'+p.fileName+'">软撤下</button><button class="danger" data-hard="'+p.fileName+'">硬撤下</button></div></td><td>'+p.date+'<div class="small">'+p.slug+'</div></td><td><div class="tags">'+p.tags.map(t => '<span class="badge">'+escapeHtml(t)+'</span>').join('')+'</div></td><td><span class="badge '+p.status+'">'+(statusLabels[p.status] || p.status)+'</span></td><td><span class="badge '+(p.publishedCopyStatus || 'missing')+'">'+(copyLabels[p.publishedCopyStatus || 'missing'] || p.publishedCopyStatus || '缺失')+'</span></td><td class="small">'+(p.lastModified ? new Date(p.lastModified).toLocaleString() : '')+'</td><td><div class="messages">'+(p.errors || []).map(escapeHtml).join('<br>')+'</div><div class="warnings">'+(p.warnings || []).map(escapeHtml).join('<br>')+'</div></td></tr>').join('');
      document.querySelectorAll('[data-soft]').forEach(b => b.onclick = () => softUnpublish([b.dataset.soft]));
      document.querySelectorAll('[data-hard]').forEach(b => b.onclick = () => hardUnpublish([b.dataset.hard]));
    }
    function escapeHtml(v) { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    async function loadAll() {
      try {
        const [status, postData, logData] = await Promise.all([api('/api/status'), api('/api/posts'), api('/api/logs')]);
        renderStatus(status); posts = postData.posts; renderRows(); setLog(logData.logs);
      } catch (e) { setLog(e.message); }
    }
    async function action(name, payload) {
      try {
        const data = await api(name, { method:'POST', body: JSON.stringify(payload || {}) });
        setLog(data.logs || data.validations?.map(v => v.fileName + ': ' + (v.valid ? '校验通过' : v.errors.join('; '))) || '完成');
        await loadAll();
      } catch (e) { setLog(e.message); }
    }
    document.querySelector('#refresh').onclick = () => action('/api/refresh');
    document.querySelector('#validate').onclick = () => action('/api/validate', { files: selectedFiles() });
    document.querySelector('#dryrun').onclick = () => action('/api/publish', { files: selectedFiles(), dryRun:true, commit:false, push:false });
    document.querySelector('#publish').onclick = () => action('/api/publish', { files: selectedFiles(), dryRun:false, commit:false, push:false });
    document.querySelector('#push').onclick = () => { const files = selectedFiles(); if (confirm('即将发布 ' + files.length + ' 篇文章，并自动 build、commit、push 到远端。继续吗？')) action('/api/publish', { files, dryRun:false, commit:true, push:true }); };
    function softUnpublish(files) {
      if (!files.length) return setLog('请至少选择一篇文章。');
      if (confirm('即将软撤下 ' + files.length + ' 篇文章，保留发布副本但设为 draft，并自动 build、commit、push。继续吗？')) {
        action('/api/unpublish', { files, mode:'soft', commit:true, push:true, deleteObsidianSource:false });
      }
    }
    function hardUnpublish(files) {
      if (!files.length) return setLog('请至少选择一篇文章。');
      const first = confirm('你将从 src/content/posts 和 public/images/posts 删除所选文章发布副本。Git 历史不会被重写。继续吗？');
      if (!first) return;
      const second = confirm('这会在 push 后把文件从当前 GitHub 文件树移除，但不会抹除旧 commit 历史。确认继续？');
      if (second) action('/api/unpublish', { files, mode:'hard', commit:true, push:true, deleteObsidianSource:false });
    }
    document.querySelector('#softUnpublish').onclick = () => softUnpublish(selectedFiles());
    document.querySelector('#hardUnpublish').onclick = () => hardUnpublish(selectedFiles());
    document.querySelector('#deploy').onclick = () => action('/api/deploy-hook');
    els.statusFilter.onchange = renderRows; els.search.oninput = renderRows;
    els.selectAll.onchange = () => document.querySelectorAll('.pick').forEach(i => { i.checked = els.selectAll.checked; });
    loadAll(); setInterval(loadAll, 5000);
  </script>
</body>
</html>`;
}

function openBrowser(url) {
  const command =
    process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  spawn(command, args, { detached: true, stdio: "ignore" }).unref();
}

async function start() {
  await loadDotEnvLocal();
  const cfg = config();
  if (cfg.host !== DEFAULT_HOST) {
    console.error("LOCAL_PUBLISHER_HOST must be 127.0.0.1 for this local-only tool.");
    process.exit(1);
  }
  if (!Number.isFinite(cfg.port) || cfg.port <= 0) {
    console.error("LOCAL_PUBLISHER_PORT must be a valid port number.");
    process.exit(1);
  }
  if (cfg.token === DEFAULT_TOKEN) {
    log("warning: LOCAL_PUBLISHER_TOKEN is using the example default; change it in .env.local.");
  }

  await refreshScan();
  if (cfg.obsidianPostsDir && existsSync(cfg.obsidianPostsDir)) {
    const watcher = chokidar.watch("**/*.md", {
      cwd: cfg.obsidianPostsDir,
      ignoreInitial: true,
      ignored: /(^|[\\/])(\.obsidian|\.trash|\.git|\.DS_Store|\.|.*\.tmp$)/,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    });
    watcher.on("ready", () => {
      state.watcherReady = true;
      log("watcher_ready");
    });
    watcher.on("add", (file) => {
      log(`post_added: ${file}`);
      refreshScan();
    });
    watcher.on("change", (file) => {
      log(`post_changed: ${file}`);
      refreshScan();
    });
    watcher.on("unlink", (file) => {
      log(`post_deleted: ${file}`);
      refreshScan();
    });
  } else {
    log("watcher_not_started: OBSIDIAN_POSTS_DIR is missing or does not exist");
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${cfg.host}:${cfg.port}`);
    if (url.pathname === "/" && req.method === "GET") return html(res, dashboardHtml());
    if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
    return notFound(res);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${cfg.port} is already in use.`);
      console.error("Stop the other process or change LOCAL_PUBLISHER_PORT in .env.local.");
      process.exit(1);
    }
    throw err;
  });
  server.listen(cfg.port, cfg.host, () => {
    const url = `http://${cfg.host}:${cfg.port}`;
    log(`publisher_ready: ${url}`);
    if (process.argv.includes("--open")) openBrowser(url);
  });
}

start().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
