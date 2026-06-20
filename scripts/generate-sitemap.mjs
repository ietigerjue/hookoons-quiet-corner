import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "src", "content", "posts");
const publicDir = path.join(repoRoot, "public");
const localSiteUrl = "http://localhost:3000";
const siteUrl = getSiteUrl();

const staticPages = [
  { path: "/", title: "Hookoon's Quiet Corner", changefreq: "weekly", priority: "1.0" },
  { path: "/blog", title: "Blog", changefreq: "weekly", priority: "0.9" },
  { path: "/projects", title: "Projects", changefreq: "monthly", priority: "0.7" },
  { path: "/about", title: "About", changefreq: "monthly", priority: "0.6" },
];

function getSiteUrl() {
  const configured = (process.env.VITE_SITE_URL || "").trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.warn(
        `Warning: VITE_SITE_URL is invalid: ${configured}. Falling back to ${localSiteUrl} for sitemap and robots output.`,
      );
    }
  }

  console.warn(
    "Warning: VITE_SITE_URL is not configured. Falling back to http://localhost:3000 for sitemap and robots output.",
  );
  return localSiteUrl;
}

function absoluteUrl(pathname) {
  const pathWithSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const cleanPath = pathWithSlash === "/" ? "/" : pathWithSlash.replace(/\/+$/, "");
  return new URL(cleanPath, `${siteUrl}/`).toString();
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (!raw.startsWith("---\n")) throw new Error(`${filePath}: missing YAML frontmatter`);
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) throw new Error(`${filePath}: frontmatter is not closed`);
  return YAML.parse(raw.slice(4, end)) ?? {};
}

function getPosts() {
  if (!fs.existsSync(postsDir)) return [];

  return fs
    .readdirSync(postsDir)
    .filter((filename) => /^\d{4}-\d{2}-\d{2}-.+\.md$/u.test(filename))
    .filter((filename) => filename !== "README.md")
    .map((filename) => {
      const filePath = path.join(postsDir, filename);
      const frontmatter = readFrontmatter(filePath);
      const date = filename.slice(0, 10);
      const filenameSlug = filename.slice(11, -3);
      const slug = typeof frontmatter.slug === "string" ? frontmatter.slug : filenameSlug;

      if (slug !== filenameSlug) throw new Error(`${filePath}: slug must match filename slug`);

      return {
        path: `/blog/${slug}`,
        title: frontmatter.title ?? slug,
        date: typeof frontmatter.date === "string" ? frontmatter.date : date,
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
        draft: frontmatter.draft === true || frontmatter.publish === false,
        changefreq: "monthly",
        priority: frontmatter.featured === true ? "0.8" : "0.7",
      };
    })
    .filter((post) => !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function sitemapXml(entries) {
  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(absoluteUrl(entry.path))}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
    <changefreq>${escapeXml(entry.changefreq)}</changefreq>
    <priority>${escapeXml(entry.priority)}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function robotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${absoluteUrl("/sitemap.xml")}
`;
}

const posts = getPosts();
const newestPostDate = posts[0]?.date ?? new Date().toISOString().slice(0, 10);
const entries = [
  ...staticPages.map((page) => ({ ...page, lastmod: newestPostDate })),
  ...posts.map((post) => ({ ...post, lastmod: post.date })),
];

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapXml(entries));
fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt());
fs.writeFileSync(
  path.join(publicDir, "discovery.json"),
  `${JSON.stringify(
    {
      site: siteUrl,
      entries: entries.map((entry) => ({
        title: entry.title,
        url: absoluteUrl(entry.path),
        path: entry.path,
        lastmod: entry.lastmod,
        tags: entry.tags ?? [],
      })),
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated sitemap, robots, and discovery output for ${entries.length} URLs.`);
