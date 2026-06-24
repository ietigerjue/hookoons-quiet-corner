import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "src", "content", "posts");
const publicDir = path.join(repoRoot, "public");
const localSiteUrl = "http://localhost:3000";
const siteUrl = getSiteUrl();

function getSiteUrl() {
  const configured = (process.env.VITE_SITE_URL || "").trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.warn(
        `Warning: VITE_SITE_URL is invalid: ${configured}. Falling back to ${localSiteUrl} for RSS output.`,
      );
    }
  }
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // already warned above
    }
  }
  console.warn(
    "Warning: VITE_SITE_URL is not configured. Falling back to http://localhost:3000 for RSS output.",
  );
  return localSiteUrl;
}

function absoluteUrl(pathname) {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(clean, `${siteUrl}/`).toString();
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (!raw.startsWith("---\n")) throw new Error(`${filePath}: missing YAML frontmatter`);
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) throw new Error(`${filePath}: frontmatter is not closed`);
  const content = raw.slice(end + 5).trim();
  return { frontmatter: YAML.parse(raw.slice(4, end)) ?? {}, content };
}

function toRFC822Date(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.toUTCString();
}

const BLOG_TITLE = "Hookoon's Quiet Corner";
const BLOG_DESCRIPTION =
  "Personal knowledge & work blog — Price Action, AI Agents, blog engineering, materials science notes.";

function getPosts() {
  if (!fs.existsSync(postsDir)) return [];

  return fs
    .readdirSync(postsDir)
    .filter((filename) => /^\d{4}-\d{2}-\d{2}-.+\.md$/u.test(filename))
    .filter((filename) => filename !== "README.md")
    .map((filename) => {
      const filePath = path.join(postsDir, filename);
      const { frontmatter, content } = readFrontmatter(filePath);
      const date = filename.slice(0, 10);
      const filenameSlug = filename.slice(11, -3);
      const slug = typeof frontmatter.slug === "string" ? frontmatter.slug : filenameSlug;
      const draft = frontmatter.draft === true || frontmatter.publish === false;

      return {
        slug,
        title: frontmatter.title ?? slug,
        titleEn: typeof frontmatter.titleEn === "string" ? frontmatter.titleEn : undefined,
        description: frontmatter.description ?? "",
        date: typeof frontmatter.date === "string" ? frontmatter.date : date,
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
        draft,
        content,
      };
    })
    .filter((post) => !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function bilingualTitle(post) {
  return post.titleEn ? `${escapeHtml(post.title)} / ${escapeHtml(post.titleEn)}` : escapeHtml(post.title);
}

function rssItem(post) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const desc = post.description ? `<p>${escapeHtml(post.description)}</p>` : "";
  return `    <item>
      <title>${bilingualTitle(post)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${toRFC822Date(post.date)}</pubDate>
      <description>${escapeXml(desc)}</description>
      ${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`;
}

const posts = getPosts();
const lastBuildDate = posts.length > 0 ? toRFC822Date(posts[0].date) : toRFC822Date(new Date().toISOString().slice(0, 10));

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(BLOG_TITLE)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(BLOG_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/rss.xml"))}" rel="self" type="application/rss+xml"/>
${posts.map(rssItem).join("\n")}
  </channel>
</rss>
`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "rss.xml"), rss);
console.log(`Generated RSS feed with ${posts.length} posts.`);
