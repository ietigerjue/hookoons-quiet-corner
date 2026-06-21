export type PostFrontmatter = {
  title: string;
  titleEn?: string;
  description: string;
  date: string;
  slug: string;
  tags: string[];
  cover?: string;
  draft?: boolean;
  publish?: boolean;
  source?: "obsidian" | "seed" | string;
  project?: string;
  projectName?: string;
  projectTitleZh?: string;
  projectDescription?: string;
  projectDescriptionZh?: string;
  featured?: boolean;
};

export type Post = {
  slug: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  tags: string[];
  date: string;
  readingTime: number;
  cover?: string;
  featured?: boolean;
  draft?: boolean;
  publish?: boolean;
  source?: string;
  project?: string;
  projectName?: string;
  projectTitleZh?: string;
  projectDescription?: string;
  projectDescriptionZh?: string;
  content: string;
};

type RawPostModule = string;

const postFiles = import.meta.glob<RawPostModule>("/src/content/posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const POST_FILENAME_RE = /^(\d{4}-\d{2}-\d{2})-([\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*)\.md$/u;
const SLUG_RE = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

function parseScalar(value: string): string | boolean | string[] {
  const trimmed = value.trim();

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((item) => item.trim().replace(/^["']|["']$/g, ""));
  }

  return trimmed.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(raw: string, filePath: string) {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) {
    throw new Error(`${filePath}: missing YAML frontmatter block`);
  }

  const normalized = raw.replace(/\r\n/g, "\n");
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error(`${filePath}: frontmatter block is not closed`);
  }

  const frontmatterText = normalized.slice(4, end);
  const content = normalized.slice(end + 5).trim();
  const frontmatter: Record<string, unknown> = {};

  for (const line of frontmatterText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf(":");
    if (separator === -1) {
      throw new Error(`${filePath}: invalid frontmatter line "${trimmed}"`);
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1);
    frontmatter[key] = parseScalar(value);
  }

  return { frontmatter, content };
}

function pathParts(filePath: string) {
  const filename = filePath.split("/").pop() ?? "";
  const match = filename.match(POST_FILENAME_RE);
  if (!match) {
    throw new Error(
      `${filePath}: post filename must be YYYY-MM-DD-slug.md with letters, numbers, and hyphens`,
    );
  }
  return { date: match[1], slug: match[2] };
}

function requireString(value: unknown, field: string, filePath: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${filePath}: frontmatter "${field}" is required`);
  }
  return value.trim();
}

function estimateReadingTime(content: string) {
  const cjkChars =
    content.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)
      ?.length ?? 0;
  const latinWords =
    content
      .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, " ")
      .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;

  return Math.max(1, Math.ceil(latinWords / 220 + cjkChars / 450));
}

function normalizeProjectSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleFromProjectValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toPost(filePath: string, raw: string): Post {
  const filename = pathParts(filePath);
  const { frontmatter, content } = parseFrontmatter(raw, filePath);
  const title = requireString(frontmatter.title, "title", filePath);
  const titleEn =
    typeof frontmatter.titleEn === "string" && frontmatter.titleEn.trim()
      ? frontmatter.titleEn.trim()
      : undefined;
  const description = requireString(frontmatter.description, "description", filePath);
  const tags = frontmatter.tags;

  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    throw new Error(`${filePath}: frontmatter "tags" must be an array`);
  }

  const slugValue =
    typeof frontmatter.slug === "string" && frontmatter.slug.trim()
      ? frontmatter.slug.trim()
      : filename.slug;
  if (slugValue !== filename.slug || !SLUG_RE.test(slugValue)) {
    throw new Error(`${filePath}: slug must match the filename slug`);
  }

  const dateValue =
    typeof frontmatter.date === "string" && frontmatter.date.trim()
      ? frontmatter.date.trim()
      : filename.date;
  if (dateValue !== filename.date) {
    throw new Error(`${filePath}: date must match the filename date`);
  }

  const draft = typeof frontmatter.draft === "boolean" ? frontmatter.draft : false;
  const publish = typeof frontmatter.publish === "boolean" ? frontmatter.publish : undefined;
  const projectValue = optionalString(frontmatter.project);
  const project = projectValue ? normalizeProjectSlug(projectValue) : undefined;

  if (projectValue && !project) {
    throw new Error(`${filePath}: frontmatter "project" must contain letters or numbers`);
  }

  return {
    slug: slugValue,
    title,
    titleEn,
    excerpt: description,
    tags,
    date: dateValue,
    readingTime: estimateReadingTime(content),
    cover:
      typeof frontmatter.cover === "string" && frontmatter.cover.trim()
        ? frontmatter.cover.trim()
        : undefined,
    featured: frontmatter.featured === true,
    draft,
    publish,
    source: typeof frontmatter.source === "string" ? frontmatter.source : undefined,
    project,
    projectName: projectValue ? titleFromProjectValue(projectValue) : undefined,
    projectTitleZh: optionalString(frontmatter.projectTitleZh),
    projectDescription: optionalString(frontmatter.projectDescription),
    projectDescriptionZh: optionalString(frontmatter.projectDescriptionZh),
    content,
  };
}

const ALL_POSTS = Object.entries(postFiles)
  .filter(([filePath]) => !filePath.endsWith("/README.md"))
  .map(([filePath, raw]) => toPost(filePath, raw));

export function sortPostsByDate(posts: Post[]) {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllPosts() {
  return sortPostsByDate(
    import.meta.env.PROD
      ? ALL_POSTS.filter((post) => !post.draft && post.publish !== false)
      : ALL_POSTS,
  );
}

export function getPublishedPosts() {
  return sortPostsByDate(ALL_POSTS.filter((post) => !post.draft && post.publish !== false));
}

export function getPostBySlug(slug: string) {
  if (!SLUG_RE.test(slug)) return undefined;
  const source = import.meta.env.PROD ? getPublishedPosts() : getAllPosts();
  return source.find((post) => post.slug === slug);
}

export function getPostsByTag(tag: string) {
  const posts = import.meta.env.PROD ? getPublishedPosts() : getAllPosts();
  return posts.filter((post) => post.tags.includes(tag));
}

export function getTagCounts() {
  const counts = new Map<string, number>();
  getPublishedPosts().forEach((post) => {
    post.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function getAllTags() {
  return ["All", ...getTagCounts().map(([tag]) => tag)];
}

export function bilingualTitle(post: Pick<Post, "title" | "titleEn">) {
  return post.titleEn ? `${post.title} / ${post.titleEn}` : post.title;
}

export function getPost(slug: string) {
  return getPostBySlug(slug);
}

export function adjacentPosts(slug: string) {
  const posts = getPublishedPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  return {
    prev: index > 0 ? posts[index - 1] : null,
    next: index >= 0 && index < posts.length - 1 ? posts[index + 1] : null,
  };
}

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const POSTS = getPublishedPosts();
export const ALL_TAGS = getAllTags();
