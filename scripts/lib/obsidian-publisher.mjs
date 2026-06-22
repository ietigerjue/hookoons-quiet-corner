import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const REPO_ROOT = process.cwd();
export const POST_FILENAME_RE = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/u;
const SLUG_RE = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const POST_LINK_RE = /^(\d{4}-\d{2}-\d{2})-(.+?)(?:\.md)?$/u;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const IMAGE_NAME_RE = /^[a-zA-Z0-9._ -]+$/;

export class PublisherError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PublisherError";
    this.details = details;
  }
}

function emit(options, message) {
  options?.logger?.(message);
}

export async function loadDotEnvLocal(options = {}) {
  if (process.env.PUBLISH_OBSIDIAN_SKIP_DOTENV === "1" || options.skipDotEnv) return;

  const envPath = path.join(options.projectRoot ?? REPO_ROOT, ".env.local");
  if (!existsSync(envPath)) return;

  const raw = await fs.readFile(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

async function realpathIfExists(filePath) {
  try {
    return await fs.realpath(filePath);
  } catch {
    return null;
  }
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return (
    relative === "" || (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

async function assertWritableInside(targetPath, rootPath) {
  await fs.mkdir(rootPath, { recursive: true });
  const rootReal = await fs.realpath(rootPath);
  const parent = path.dirname(targetPath);
  await fs.mkdir(parent, { recursive: true });
  const parentReal = await fs.realpath(parent);
  if (!isInside(parentReal, rootReal)) {
    throw new PublisherError(`Refusing to write outside ${rootPath}: ${targetPath}`);
  }
}

export function normalizeFileRef(ref) {
  const cleanRef = decodeURIComponent(String(ref)).split("#")[0].split("?")[0].trim();
  if (!cleanRef) return "";
  if (/^file:\/\//i.test(cleanRef)) {
    try {
      return fileURLToPath(cleanRef);
    } catch {
      throw new PublisherError(`Invalid file URL: ${ref}`);
    }
  }
  return cleanRef;
}

function splitFrontmatter(raw, filePath = "source post") {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new PublisherError(`${filePath}: missing YAML frontmatter`);
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) throw new PublisherError(`${filePath}: frontmatter block is not closed`);

  const frontmatterText = normalized.slice(4, end);
  const body = normalized.slice(end + 5).trimStart();
  const data = YAML.parse(frontmatterText) ?? {};

  if (typeof data !== "object" || Array.isArray(data)) {
    throw new PublisherError(`${filePath}: frontmatter must be a YAML object`);
  }

  return { data, body };
}

function titleFromFilenameTitle(value) {
  return String(value).normalize("NFKC").trim().replace(/[_-]+/gu, " ").replace(/\s+/gu, " ");
}

function shouldUseFilenameTitle(title, filenameTitle) {
  if (!title) return true;

  const normalizedTitle = normalizeSlug(title, "title");
  const normalizedFilenameTitle = normalizeSlug(filenameTitle, "filename title");
  const datePrefixedTitle = title.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/u)?.[2] ?? "";

  return (
    normalizedTitle !== normalizedFilenameTitle &&
    (normalizedFilenameTitle.startsWith(normalizedTitle) ||
      (datePrefixedTitle && normalizeSlug(datePrefixedTitle, "title") !== normalizedFilenameTitle))
  );
}

function normalizeFrontmatter(data, date, slug, fileTitle, options = {}) {
  const errors = [];
  const warnings = [];

  let title = typeof data.title === "string" ? data.title.trim() : "";
  if (shouldUseFilenameTitle(title, fileTitle)) {
    if (title) {
      warnings.push(
        `frontmatter title "${title}" does not match filename title; using "${titleFromFilenameTitle(fileTitle)}"`,
      );
    } else {
      warnings.push(`frontmatter field "title" is missing; using filename title "${fileTitle}"`);
    }
    title = titleFromFilenameTitle(fileTitle);
  }
  const titleEnSource = data.titleEn ?? data.title_en ?? data.englishTitle;
  if (titleEnSource !== undefined && typeof titleEnSource !== "string") {
    errors.push('frontmatter field "titleEn" must be a string when provided');
  }
  if (typeof data.description !== "string" || data.description.trim() === "") {
    errors.push('frontmatter field "description" is required');
  }
  if (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== "string")) {
    errors.push('frontmatter field "tags" must be an array');
  } else if (data.tags.length === 0) {
    warnings.push('frontmatter field "tags" is empty');
  }
  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    errors.push('frontmatter field "draft" must be a boolean when provided');
  }
  if (data.publish !== undefined && typeof data.publish !== "boolean") {
    errors.push('frontmatter field "publish" must be a boolean when provided');
  }

  if (errors.length && !options.collectOnly) {
    throw new PublisherError(errors.join("; "));
  }

  return {
    frontmatter: {
      title,
      titleEn: typeof titleEnSource === "string" ? titleEnSource.trim() : "",
      description: typeof data.description === "string" ? data.description.trim() : "",
      date,
      slug,
      tags: Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
      cover: typeof data.cover === "string" ? data.cover.trim() : "",
      draft: data.draft ?? false,
      publish: data.publish ?? false,
      source: "obsidian",
      featured: data.featured === true ? true : undefined,
    },
    errors,
    warnings,
  };
}

function frontmatterToMarkdown(data) {
  const lines = [
    "---",
    `title: ${JSON.stringify(data.title)}`,
    ...(data.titleEn ? [`titleEn: ${JSON.stringify(data.titleEn)}`] : []),
    `description: ${JSON.stringify(data.description)}`,
    `date: ${JSON.stringify(data.date)}`,
    `slug: ${JSON.stringify(data.slug)}`,
    `tags: [${data.tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
    `cover: ${JSON.stringify(data.cover ?? "")}`,
    `draft: ${data.draft ? "true" : "false"}`,
  ];
  if (data.publish !== undefined) lines.push(`publish: ${data.publish ? "true" : "false"}`);
  if (data.unpublishedAt) lines.push(`unpublishedAt: ${JSON.stringify(data.unpublishedAt)}`);
  lines.push('source: "obsidian"');
  if (data.featured) lines.push("featured: true");
  lines.push("---", "");
  return lines.join("\n");
}

function parseFilename(filePath) {
  const fileName = path.basename(filePath);
  const match = fileName.match(POST_FILENAME_RE);
  if (!match) {
    throw new PublisherError(
      "Post filename must be YYYY-MM-DD-title.md. The title part may use letters, numbers, Chinese characters, spaces, underscores, and hyphens.",
      { fileName },
    );
  }
  const slug = normalizeSlug(match[2], fileName);
  return {
    fileName,
    outputFileName: `${match[1]}-${slug}.md`,
    date: match[1],
    slug,
    fileTitle: match[2],
  };
}

export function normalizeSlug(value, source = "slug") {
  const normalized = String(value)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/gu, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized || !SLUG_RE.test(normalized)) {
    throw new PublisherError(
      `${source}: title part must contain at least one letter or number after slug normalization`,
    );
  }
  return normalized;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function blogPostPath(fileName, options = {}) {
  return path.join(options.projectRoot ?? REPO_ROOT, "src", "content", "posts", fileName);
}

function postImagesDir(slug, options = {}) {
  return path.join(options.projectRoot ?? REPO_ROOT, "public", "images", "posts", slug);
}

export function postImagesPath(slug, options = {}) {
  return postImagesDir(slug, options);
}

function sanitizeImageOutputName(value) {
  const base = path.basename(value).replace(/\s+/g, "-");
  if (!IMAGE_NAME_RE.test(path.basename(value))) {
    throw new PublisherError(`Unsafe image filename: ${value}`);
  }
  return base;
}

function isExternalLink(ref) {
  return /^(https?:\/\/|mailto:)/i.test(ref.trim());
}

function articleHref(ref) {
  const cleanRef = normalizeFileRef(ref).replace(/\\/g, "/");
  const filename = cleanRef.split("/").pop() ?? "";
  const match = filename.match(POST_LINK_RE);
  if (!match) return null;
  return `/blog/${normalizeSlug(match[2], filename)}`;
}

function isLocalFileLink(ref) {
  const cleanRef = String(ref).trim();
  return (
    /^file:\/\//i.test(cleanRef) ||
    /^[A-Za-z]:[\\/]/.test(cleanRef) ||
    /^\/Users\//.test(cleanRef) ||
    /^~[\\/]/.test(cleanRef) ||
    /(^|[\\/])attachments[\\/]/i.test(cleanRef)
  );
}

function transformOutsideCodeBlocks(body, transform) {
  // Split on fenced code blocks AND inline code spans, protecting both from transformation.
  // Order matters: fences first, then inline code in parts that aren't fences.
  const fenceRe = /(```[\s\S]*?```|`[^`\n]+`)/g;
  return body
    .split(fenceRe)
    .map((part) => (part.startsWith("```") || (part.startsWith("`") && part.endsWith("`")) ? part : transform(part)))
    .join("");
}

function collectImageRefs(markdown) {
  const refs = [];
  transformOutsideCodeBlocks(markdown, (part) => {
    part.replace(/!\[\[([^\]]+)\]\]/g, (match, rawRef) => {
      const [imageRef] = String(rawRef).split("|");
      refs.push(imageRef.trim());
      return match;
    });
    part.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, rawRef) => {
      const ref = String(rawRef).trim();
      if (!/^(https?:|\/)/i.test(ref)) refs.push(ref);
      return match;
    });
    return part;
  });
  return refs;
}

export function convertObsidianLinks(markdown, options = {}) {
  const warnings = options.warnings ?? [];
  return transformOutsideCodeBlocks(markdown, (part) => {
    let next = part.replace(/(^|[^!])\[([^\]]+)\]\(([^)]+)\)/g, (match, prefix, label, rawRef) => {
      const ref = String(rawRef).trim();
      if (isExternalLink(ref) || ref.startsWith("/") || ref.startsWith("#")) return match;

      const href = articleHref(ref);
      if (href) return `${prefix}[${label}](${href})`;

      if (isLocalFileLink(ref)) {
        warnings.push(`local non-image link removed from published Markdown: ${ref}`);
        return `${prefix}${label}`;
      }

      return match;
    });

    next = next
      .replace(/(^|[^!])\[\[([^|\]]+)\|([^\]]+)\]\]/g, (match, prefix, rawTarget, rawLabel) => {
        const target = String(rawTarget).trim();
        const label = String(rawLabel).trim();
        const href = articleHref(target);
        if (href) return `${prefix}[${label}](${href})`;
        return `${prefix}${label}`;
      })
      .replace(/(^|[^!])\[\[([^\]]+)\]\]/g, (match, prefix, rawTarget) => {
        const target = String(rawTarget).trim();
        const href = articleHref(target);
        if (href) return `${prefix}[${target}](${href})`;
        return `${prefix}${target}`;
      });

    return next;
  });
}

export async function parseObsidianFile(filePath, options = {}) {
  const realPath = (await realpathIfExists(filePath)) ?? path.resolve(filePath);
  const { fileName, outputFileName, date, slug, fileTitle } = parseFilename(realPath);
  const raw = await fs.readFile(realPath, "utf8");
  const { data, body } = splitFrontmatter(raw, realPath);
  const normalized = normalizeFrontmatter(data, date, slug, fileTitle, {
    collectOnly: options.collectOnly,
  });

  return {
    id: fileName,
    fileName,
    outputFileName,
    absolutePath: realPath,
    sourceDir: path.dirname(realPath),
    date,
    slug,
    raw,
    frontmatterRaw: data,
    frontmatter: normalized.frontmatter,
    body,
    errors: normalized.errors,
    warnings: normalized.warnings,
  };
}

async function resolveAllowedRoots(options = {}) {
  const roots = [];
  for (const root of [
    options.obsidianPostsDir,
    options.obsidianVaultPath,
    ...imageSearchDirCandidates(options),
  ].filter(Boolean)) {
    const real = await realpathIfExists(path.resolve(root));
    if (real) roots.push(real);
  }
  return [...new Set(roots)];
}

function splitPathList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(path.delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function imageSearchDirCandidates(options = {}) {
  const configured = splitPathList(options.obsidianImageDirs ?? process.env.OBSIDIAN_IMAGE_DIRS);
  const roots = [options.obsidianPostsDir, options.obsidianVaultPath].filter(Boolean);
  const candidates = [...configured];

  for (const root of roots) {
    const resolved = path.resolve(root);
    candidates.push(path.join(resolved, "图片"));
    candidates.push(path.join(resolved, "images"));
    candidates.push(path.join(resolved, "attachments"));
    candidates.push(path.join(resolved, "Attachments"));
    candidates.push(path.join(path.dirname(resolved), "图片"));
    candidates.push(path.join(path.dirname(resolved), "images"));
    candidates.push(path.join(path.dirname(resolved), "attachments"));
    candidates.push(path.join(path.dirname(resolved), "Attachments"));
  }

  return [...new Set(candidates)];
}

async function findImagePath(ref, post, options = {}) {
  const cleanRef = normalizeFileRef(ref);
  if (!cleanRef) throw new PublisherError("Empty image reference");
  const allowedRoots = options.allowedRoots ?? (await resolveAllowedRoots(options));
  const candidates = [];

  if (path.isAbsolute(cleanRef)) {
    candidates.push(path.resolve(cleanRef));
  } else {
    candidates.push(path.resolve(post.sourceDir, cleanRef));
    for (const root of allowedRoots) {
      candidates.push(path.resolve(root, cleanRef));
      candidates.push(path.resolve(root, "attachments", cleanRef));
      candidates.push(path.resolve(root, "Attachments", cleanRef));
      candidates.push(path.resolve(root, "图片", cleanRef));
      candidates.push(path.resolve(root, "images", cleanRef));
    }
  }

  for (const candidate of candidates) {
    const real = await realpathIfExists(candidate);
    if (!real) continue;
    if (allowedRoots.length > 0 && !allowedRoots.some((root) => isInside(real, root))) {
      throw new PublisherError(`Image reference escapes the allowed Obsidian roots: ${ref}`);
    }
    const ext = path.extname(real).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) throw new PublisherError(`Unsupported image extension: ${ref}`);
    return real;
  }

  throw new PublisherError(`Referenced image not found: ${ref}`);
}

async function copyImage(ref, post, context, options = {}) {
  const source = await findImagePath(ref, post, context);
  const ext = path.extname(source).toLowerCase();
  const outputName = options.outputName ?? sanitizeImageOutputName(path.basename(source));
  const finalName = outputName.includes(".") ? outputName : `${outputName}${ext}`;
  const target = path.join(postImagesDir(post.slug, context), finalName);
  const publicPath = `/images/posts/${post.slug}/${finalName}`;

  if (context.dryRun) {
    context.generatedFiles.add(target);
    return publicPath;
  }

  await assertWritableInside(target, path.join(context.projectRoot ?? REPO_ROOT, "public"));
  if (existsSync(target))
    emit(context, `Warning: overwriting existing image ${path.relative(REPO_ROOT, target)}`);
  await fs.copyFile(source, target);
  context.generatedFiles.add(target);
  return publicPath;
}

export async function copyPostAssets(post, options = {}) {
  const context = { ...options, generatedFiles: options.generatedFiles ?? new Set() };
  const copied = [];
  for (const ref of collectImageRefs(post.body)) {
    copied.push(await copyImage(ref, post, context));
  }
  return copied;
}

export async function validateObsidianPost(filePath, options = {}) {
  const errors = [];
  const warnings = [];
  let post;

  try {
    post = await parseObsidianFile(filePath, { collectOnly: true });
    errors.push(...post.errors);
    warnings.push(...post.warnings);

    const allowedRoots = await resolveAllowedRoots(options);
    for (const ref of [post.frontmatter.cover, ...collectImageRefs(post.body)].filter(Boolean)) {
      try {
        await findImagePath(ref, post, { ...options, allowedRoots });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    convertObsidianLinks(post.body, { warnings });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { valid: errors.length === 0, errors, warnings, post };
}

export async function transformObsidianPost(filePath, options = {}) {
  const post = await parseObsidianFile(filePath);
  const generatedFiles = options.generatedFiles ?? new Set();
  const context = {
    ...options,
    projectRoot: options.projectRoot ?? REPO_ROOT,
    allowedRoots: await resolveAllowedRoots(options),
    generatedFiles,
  };

  let frontmatter = { ...post.frontmatter };
  if (frontmatter.cover) {
    frontmatter.cover = await copyImage(frontmatter.cover, post, context, { outputName: "cover" });
  }

  const warnings = [];
  let body = convertObsidianLinks(post.body, { warnings });
  const pending = [];
  body = transformOutsideCodeBlocks(body, (part) => {
    let next = part.replace(/!\[\[([^\]]+)\]\]/g, (match, rawRef) => {
      const [imageRef, altValue] = String(rawRef).split("|");
      const token = `@@OBSIDIAN_IMAGE_${pending.length}@@`;
      pending.push({
        token,
        imageRef: imageRef.trim(),
        alt: (altValue ?? path.basename(imageRef)).trim(),
      });
      return token;
    });

    next = next.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, rawRef) => {
      const ref = String(rawRef).trim();
      if (/^(https?:|\/)/i.test(ref)) return match;
      const token = `@@MARKDOWN_IMAGE_${pending.length}@@`;
      pending.push({ token, imageRef: ref, alt: String(alt).trim() || path.basename(ref) });
      return token;
    });

    return next;
  });

  for (const item of pending) {
    const publicPath = await copyImage(item.imageRef, post, context);
    const alt = item.alt.replace(/[\[\]\n\r]/g, " ").trim();
    body = body.replace(item.token, `![${alt}](${publicPath})`);
  }

  const output = `${frontmatterToMarkdown(frontmatter)}${body.trim()}\n`;
  const targetPath = blogPostPath(post.outputFileName, context);
  generatedFiles.add(targetPath);

  return { post, frontmatter, body, output, targetPath, generatedFiles, warnings };
}

export async function publishObsidianPost(filePath, options = {}) {
  const transformed = await transformObsidianPost(filePath, options);
  if (!options.dryRun) {
    await assertWritableInside(
      transformed.targetPath,
      path.join(options.projectRoot ?? REPO_ROOT, "src", "content", "posts"),
    );
    if (existsSync(transformed.targetPath)) {
      emit(
        options,
        `Warning: overwriting existing post ${path.relative(REPO_ROOT, transformed.targetPath)}`,
      );
    }
    await fs.writeFile(transformed.targetPath, transformed.output, "utf8");
  }
  emit(
    options,
    `Published ${transformed.post.fileName} to ${path.relative(REPO_ROOT, transformed.targetPath)}`,
  );
  return transformed;
}

function commandSpec(command, args) {
  if (command !== "npm") return { command, args };
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    throw new PublisherError("npm_execpath is unavailable; run this script through npm scripts");
  }
  return { command: process.execPath, args: [npmCli, ...args] };
}

export function runCommand(command, args, options = {}) {
  const spec = commandSpec(command, args);
  const result = spawnSync(spec.command, spec.args, {
    cwd: options.projectRoot ?? REPO_ROOT,
    encoding: "utf8",
    shell: false,
    timeout: options.timeout ?? 120000,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (stdout.trim()) emit(options, stdout.trim());
  if (stderr.trim()) emit(options, stderr.trim());
  if (result.error)
    throw new PublisherError(`${command} ${args.join(" ")} failed: ${result.error.message}`);
  if (result.status !== 0) {
    throw new PublisherError(`${command} ${args.join(" ")} exited with status ${result.status}`, {
      stdout,
      stderr,
    });
  }
  return { stdout, stderr, status: result.status };
}

export function capture(command, args, options = {}) {
  return runCommand(command, args, {
    ...options,
    logger: undefined,
    timeout: options.timeout ?? 30000,
  }).stdout.trim();
}

export function runBuild(options = {}) {
  return runCommand("npm", ["run", "build"], { ...options, timeout: options.timeout ?? 180000 });
}

export function getGitInfo(options = {}) {
  let remote = "";
  try {
    remote = capture("git", ["remote", "get-url", "origin"], options);
  } catch {
    remote = "";
  }
  return {
    branch: capture("git", ["branch", "--show-current"], options) || "unknown",
    status: capture("git", ["status", "--porcelain"], options),
    remote,
  };
}

export function commitAndPush(files, commitMessage, options = {}) {
  const normalized = [...new Set(files)].map((file) => path.resolve(file));
  const projectRoot = options.projectRoot ?? REPO_ROOT;
  const allowedRoots = [
    path.join(projectRoot, "src", "content", "posts"),
    path.join(projectRoot, "public", "images", "posts"),
  ];
  for (const file of normalized) {
    if (!allowedRoots.some((root) => isInside(file, path.resolve(root)))) {
      throw new PublisherError(`Refusing to stage file outside publish roots: ${file}`);
    }
  }
  const status = capture("git", ["status", "--porcelain"], { ...options, projectRoot });
  const hasConflicts = status
    .split("\n")
    .filter(Boolean)
    .some((line) => /^(DD|AU|UD|UA|DU|AA|UU)/.test(line));
  if (hasConflicts) throw new PublisherError("Git has unresolved conflicts; refusing to deploy");

  const staged = capture("git", ["diff", "--cached", "--name-only"], { ...options, projectRoot })
    .split("\n")
    .filter(Boolean);
  if (staged.length > 0) {
    throw new PublisherError(
      "There are already staged files; commit or unstage them before commit/push",
    );
  }

  const relativeFiles = normalized.map((file) => path.relative(projectRoot, file));
  if (options.stageMode === "rm") {
    runCommand("git", ["rm", "-r", "--ignore-unmatch", "--", ...relativeFiles], {
      ...options,
      projectRoot,
      timeout: 30000,
    });
  } else {
    runCommand("git", ["add", "--", ...relativeFiles], { ...options, projectRoot, timeout: 30000 });
  }

  const hasStagedChanges =
    spawnSync("git", ["diff", "--cached", "--quiet"], {
      cwd: projectRoot,
      shell: false,
      timeout: 30000,
    }).status !== 0;

  if (!hasStagedChanges) {
    emit(options, "No changes to commit.");
    return { committed: false, pushed: false };
  }

  runCommand("git", ["commit", "-m", commitMessage], { ...options, projectRoot, timeout: 30000 });
  if (options.push) {
    runCommand("git", ["push"], { ...options, projectRoot, timeout: 120000 });
    return { committed: true, pushed: true };
  }
  return { committed: true, pushed: false };
}

export async function publishObsidianPosts(filePaths, options = {}) {
  const generatedFiles = new Set();
  const results = [];
  for (const filePath of filePaths) {
    results.push(await publishObsidianPost(filePath, { ...options, generatedFiles }));
  }

  if (options.dryRun) {
    return {
      results,
      generatedFiles: Array.from(generatedFiles),
      built: false,
      committed: false,
      pushed: false,
    };
  }

  runBuild(options);

  let gitResult = { committed: false, pushed: false };
  if (options.commit) {
    gitResult = commitAndPush(
      Array.from(generatedFiles),
      options.commitMessage || `publish: batch posts ${new Date().toISOString().slice(0, 10)}`,
      { ...options, push: options.push },
    );
  }

  return { results, generatedFiles: Array.from(generatedFiles), built: true, ...gitResult };
}

async function assertRemovableInside(targetPath, rootPath) {
  const rootReal = await fs.realpath(rootPath);
  const parent = path.dirname(targetPath);
  const parentReal = existsSync(parent) ? await fs.realpath(parent) : rootReal;
  if (!isInside(parentReal, rootReal)) {
    throw new PublisherError(`Refusing to remove outside ${rootPath}: ${targetPath}`);
  }
}

async function removeFileIfExists(filePath, options = {}) {
  if (options.dryRun || !existsSync(filePath)) return false;
  await assertRemovableInside(
    filePath,
    path.join(options.projectRoot ?? REPO_ROOT, "src", "content", "posts"),
  );
  await fs.rm(filePath, { force: true });
  return true;
}

async function removeDirIfExists(dirPath, options = {}) {
  if (options.dryRun || !existsSync(dirPath)) return false;
  await assertRemovableInside(
    dirPath,
    path.join(options.projectRoot ?? REPO_ROOT, "public", "images", "posts"),
  );
  await fs.rm(dirPath, { recursive: true, force: true });
  return true;
}

function normalizePostFileName(fileName) {
  if (typeof fileName !== "string" || fileName.includes("/") || fileName.includes("\\")) {
    throw new PublisherError(`Invalid post filename: ${fileName}`);
  }
  const parsed = parseFilename(fileName);
  return parsed;
}

export async function unpublishPosts(files, options = {}) {
  const mode = options.mode ?? "soft";
  if (!["soft", "hard"].includes(mode)) {
    throw new PublisherError('Unpublish mode must be "soft" or "hard"');
  }
  if (options.deleteObsidianSource) {
    throw new PublisherError("deleteObsidianSource is not supported in this version");
  }
  if (!Array.isArray(files) || files.length === 0) {
    throw new PublisherError("files must be a non-empty array");
  }

  const projectRoot = options.projectRoot ?? REPO_ROOT;
  const affectedFiles = new Set();
  const results = [];
  const now = new Date().toISOString();

  for (const fileNameInput of files) {
    const { fileName, outputFileName, slug } = normalizePostFileName(fileNameInput);
    const targetPath = blogPostPath(outputFileName, { projectRoot });
    const imageDir = postImagesDir(slug, { projectRoot });
    if (!existsSync(targetPath)) {
      throw new PublisherError(`Published post does not exist: ${outputFileName}`);
    }

    if (mode === "soft") {
      const published = await readPublishedPost(targetPath);
      const data = {
        ...published.frontmatter,
        title: published.title,
        titleEn: published.titleEn,
        description: published.description,
        date: published.date,
        slug: published.slug,
        tags: published.tags,
        cover: published.cover,
        draft: true,
        publish: false,
        unpublishedAt: now,
      };
      const output = `${frontmatterToMarkdown(data)}${published.body.trim()}\n`;
      if (!options.dryRun) await fs.writeFile(targetPath, output, "utf8");
      affectedFiles.add(targetPath);
      emit(options, `Soft unpublished ${outputFileName}`);
      results.push({
        fileName,
        outputFileName,
        slug,
        mode,
        postPath: targetPath,
        imageDir,
        changed: true,
      });
    } else {
      await removeFileIfExists(targetPath, { ...options, projectRoot });
      await removeDirIfExists(imageDir, { ...options, projectRoot });
      affectedFiles.add(targetPath);
      if (existsSync(imageDir) || options.dryRun) affectedFiles.add(imageDir);
      else affectedFiles.add(imageDir);
      emit(options, `Hard unpublished ${outputFileName}`);
      results.push({
        fileName,
        outputFileName,
        slug,
        mode,
        postPath: targetPath,
        imageDir,
        changed: true,
      });
    }
  }

  if (options.dryRun) {
    return {
      results,
      affectedFiles: Array.from(affectedFiles),
      built: false,
      committed: false,
      pushed: false,
    };
  }

  runBuild(options);

  let gitResult = { committed: false, pushed: false };
  if (options.commit) {
    gitResult = commitAndPush(
      Array.from(affectedFiles),
      options.commitMessage ||
        (mode === "soft"
          ? `unpublish: ${results.map((result) => result.slug).join(", ")}`
          : `remove post: ${results.map((result) => result.slug).join(", ")}`),
      {
        ...options,
        projectRoot,
        push: options.push,
        stageMode: mode === "hard" ? "rm" : "add",
      },
    );
  }

  return { results, affectedFiles: Array.from(affectedFiles), built: true, ...gitResult };
}

function shouldIgnoreObsidianPath(filePath) {
  const parts = filePath.split(/[\\/]/);
  const base = path.basename(filePath);
  return (
    base.startsWith(".") ||
    base.endsWith(".tmp") ||
    parts.includes(".trash") ||
    parts.includes(".obsidian")
  );
}

async function targetHashFor(fileName, options = {}) {
  const target = blogPostPath(fileName, options);
  if (!existsSync(target)) return null;
  return hash(await fs.readFile(target, "utf8"));
}

async function readPublishedPost(filePath) {
  const { fileName, outputFileName, date, slug } = parseFilename(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  const { data, body } = splitFrontmatter(raw, filePath);
  return {
    id: fileName,
    fileName,
    outputFileName,
    absolutePath: path.resolve(filePath),
    date: typeof data.date === "string" ? data.date : date,
    slug: typeof data.slug === "string" ? data.slug : slug,
    title: typeof data.title === "string" ? data.title : "",
    titleEn: typeof data.titleEn === "string" ? data.titleEn : "",
    description: typeof data.description === "string" ? data.description : "",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    draft: data.draft === true,
    publish: data.publish === true,
    cover: typeof data.cover === "string" ? data.cover : "",
    unpublishedAt: typeof data.unpublishedAt === "string" ? data.unpublishedAt : "",
    body,
    frontmatter: data,
  };
}

function collectPublishedImageRefs(markdown, cover = "") {
  const refs = [];
  if (cover.startsWith("/images/")) refs.push(cover);
  transformOutsideCodeBlocks(markdown, (part) => {
    part.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, rawRef) => {
      const ref = String(rawRef).trim();
      if (ref.startsWith("/images/")) refs.push(ref);
      return match;
    });
    return part;
  });
  return refs;
}

async function hasMissingPublishedAssets(post, options = {}) {
  const projectRoot = options.projectRoot ?? REPO_ROOT;
  for (const ref of collectPublishedImageRefs(post.body, post.cover)) {
    const localPath = path.join(projectRoot, "public", ref.replace(/^\/+/, ""));
    if (!existsSync(localPath)) return true;
  }
  return false;
}

export async function scanPublishedPosts(options = {}) {
  const postsDir = path.join(options.projectRoot ?? REPO_ROOT, "src", "content", "posts");
  if (!existsSync(postsDir)) return [];

  const entries = await fs.readdir(postsDir, { withFileTypes: true });
  const posts = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") continue;
    const filePath = path.join(postsDir, entry.name);
    try {
      const post = await readPublishedPost(filePath);
      const stat = await fs.stat(filePath);
      const missingAssets = await hasMissingPublishedAssets(post, options);
      posts.push({
        ...post,
        status: missingAssets ? "missing_assets" : post.draft ? "unpublished" : "published",
        publishedCopyStatus: missingAssets ? "missing_assets" : post.draft ? "draft" : "published",
        lastModified: stat.mtime.toISOString(),
        errors: missingAssets ? ["published post references missing image assets"] : [],
        warnings: [],
      });
    } catch (error) {
      posts.push({
        id: entry.name,
        fileName: entry.name,
        absolutePath: filePath,
        title: "",
        titleEn: "",
        description: "",
        date: "",
        slug: "",
        tags: [],
        draft: false,
        publish: false,
        cover: "",
        status: "error",
        publishedCopyStatus: "error",
        lastModified: "",
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
      });
    }
  }
  return posts;
}

export async function scanObsidianPosts(options = {}) {
  const postsDir = options.obsidianPostsDir || process.env.OBSIDIAN_POSTS_DIR;
  if (!postsDir) throw new PublisherError("OBSIDIAN_POSTS_DIR is required");
  const realPostsDir = await realpathIfExists(path.resolve(postsDir));
  if (!realPostsDir) throw new PublisherError(`OBSIDIAN_POSTS_DIR does not exist: ${postsDir}`);

  const files = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (shouldIgnoreObsidianPath(fullPath)) continue;
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }
  await walk(realPostsDir);

  const publishedPosts = await scanPublishedPosts(options);
  const publishedByOutputFile = new Map(publishedPosts.map((post) => [post.outputFileName, post]));
  const seenSourceFiles = new Set();
  const seenPublishedFiles = new Set();
  const posts = [];
  for (const file of files.sort()) {
    const errors = [];
    const warnings = [];
    let status = "error";
    let info = {
      id: path.basename(file),
      fileName: path.basename(file),
      absolutePath: file,
      title: "",
      titleEn: "",
      description: "",
      date: "",
      slug: "",
      tags: [],
      draft: false,
      publish: false,
      cover: "",
      status,
      lastModified: "",
      errors,
      warnings,
    };

    try {
      const stat = await fs.stat(file);
      const post = await parseObsidianFile(file, { collectOnly: true });
      seenSourceFiles.add(post.fileName);
      seenPublishedFiles.add(post.outputFileName);
      errors.push(...post.errors);
      warnings.push(...post.warnings);
      const validation = await validateObsidianPost(file, options);
      errors.push(...validation.errors.filter((error) => !errors.includes(error)));
      warnings.push(...validation.warnings.filter((warning) => !warnings.includes(warning)));

      const published = publishedByOutputFile.get(post.outputFileName);
      let publishedCopyStatus = published?.publishedCopyStatus ?? "missing";

      if (errors.length > 0) {
        status = errors.some((error) => /image|asset|Referenced image/i.test(error))
          ? "missing_assets"
          : "invalid";
      } else if (post.frontmatter.draft) {
        status = "draft";
      } else if (post.frontmatter.publish !== true) {
        status = "not_publishable";
      } else if (published?.draft) {
        status = "unpublished";
      } else {
        const transformed = await transformObsidianPost(file, { ...options, dryRun: true });
        const existingHash = await targetHashFor(post.outputFileName, options);
        const outputHash = hash(transformed.output);
        if (!existingHash) {
          status = "new";
          publishedCopyStatus = "missing";
        } else if (existingHash !== outputHash) {
          status = "changed";
          publishedCopyStatus = "changed";
        } else {
          status = "published";
          publishedCopyStatus = "published";
        }
      }

      info = {
        id: post.fileName,
        fileName: post.fileName,
        outputFileName: post.outputFileName,
        absolutePath: post.absolutePath,
        title: post.frontmatter.title,
        titleEn: post.frontmatter.titleEn,
        description: post.frontmatter.description,
        date: post.date,
        slug: post.slug,
        tags: post.frontmatter.tags,
        draft: post.frontmatter.draft,
        publish: post.frontmatter.publish,
        cover: post.frontmatter.cover,
        status,
        publishedCopyStatus,
        publishedPath: published?.absolutePath ?? blogPostPath(post.outputFileName, options),
        lastModified: stat.mtime.toISOString(),
        errors,
        warnings,
      };
    } catch (error) {
      const stat = existsSync(file) ? await fs.stat(file) : null;
      errors.push(error instanceof Error ? error.message : String(error));
      info = { ...info, status: "error", lastModified: stat?.mtime.toISOString() ?? "" };
    }
    posts.push(info);
  }

  for (const published of publishedPosts) {
    if (seenSourceFiles.has(published.fileName) || seenPublishedFiles.has(published.outputFileName))
      continue;
    posts.push({
      ...published,
      id: published.fileName,
      absolutePath: "",
      publishedPath: published.absolutePath,
      status: published.draft ? "unpublished" : "orphaned_published",
      publishedCopyStatus: published.draft ? "draft" : "published",
      warnings: [
        ...(published.warnings ?? []),
        "published copy exists but matching Obsidian source was not found",
      ],
    });
  }

  return posts;
}

export async function resolveSourcePost(postArg, options = {}) {
  const postsDir = options.obsidianPostsDir || process.env.OBSIDIAN_POSTS_DIR;
  const vaultPath = options.obsidianVaultPath || process.env.OBSIDIAN_VAULT_PATH;
  const isAbsolute = path.isAbsolute(postArg);
  let sourcePath;

  if (isAbsolute) {
    sourcePath = path.resolve(postArg);
  } else {
    if (postArg.includes("/") || postArg.includes("\\") || postArg.includes("..")) {
      throw new PublisherError("Relative publish input must be a filename, not a path");
    }
    if (!postsDir)
      throw new PublisherError("OBSIDIAN_POSTS_DIR is required when publishing by filename");
    sourcePath = path.resolve(postsDir, postArg);
  }

  const { fileName } = parseFilename(sourcePath);
  const sourceReal = await realpathIfExists(sourcePath);
  if (!sourceReal) throw new PublisherError(`Source post does not exist: ${sourcePath}`);

  const allowedRoots = [];
  for (const root of [postsDir, vaultPath].filter(Boolean)) {
    const real = await realpathIfExists(path.resolve(root));
    if (real) allowedRoots.push(real);
  }
  if (isAbsolute && allowedRoots.length === 0)
    allowedRoots.push(await fs.realpath(path.dirname(sourceReal)));

  if (allowedRoots.length > 0 && !allowedRoots.some((root) => isInside(sourceReal, root))) {
    throw new PublisherError("Source post is outside OBSIDIAN_POSTS_DIR / OBSIDIAN_VAULT_PATH");
  }

  return { sourcePath: sourceReal, fileName };
}
