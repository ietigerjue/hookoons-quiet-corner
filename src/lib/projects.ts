import { PROJECT_DEFINITIONS, type Project } from "@/content/projects/projects";
import { getPublishedPosts, type Post } from "@/lib/posts";

export type { Project };

function titleFromSlug(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function uniqueTags(posts: Post[]) {
  const tags: string[] = [];
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!tags.includes(tag)) tags.push(tag);
    });
  });
  return tags.slice(0, 4);
}

export function getProjects(): Project[] {
  const groups = new Map<string, Post[]>();

  getPublishedPosts().forEach((post) => {
    if (!post.project) return;
    const existing = groups.get(post.project) ?? [];
    existing.push(post);
    groups.set(post.project, existing);
  });

  return Array.from(groups.entries())
    .map(([slug, posts]) => {
      const definition = PROJECT_DEFINITIONS.find((project) => project.slug === slug);
      const newest = posts[0];

      return {
        slug,
        title: definition?.title ?? newest?.projectName ?? titleFromSlug(slug),
        titleZh:
          definition?.titleZh ??
          newest?.projectTitleZh ??
          newest?.projectName ??
          titleFromSlug(slug),
        description:
          definition?.description ??
          newest?.projectDescription ??
          `Notes collected under ${newest?.projectName ?? titleFromSlug(slug)}.`,
        descriptionZh:
          definition?.descriptionZh ??
          newest?.projectDescriptionZh ??
          `「${newest?.projectTitleZh ?? newest?.projectName ?? titleFromSlug(slug)}」系列下的文章和记录。`,
        tags: definition?.tags ?? uniqueTags(posts),
        status: definition?.status ?? "active",
        href: definition?.href,
        postCount: posts.length,
      } satisfies Project;
    })
    .sort(
      (a, b) =>
        getPostsByProject(b)[0]?.date.localeCompare(getPostsByProject(a)[0]?.date ?? "") ?? 0,
    );
}

export const PROJECTS = getProjects();

export function getProjectBySlug(slug: string) {
  return getProjects().find((project) => project.slug === slug);
}

export function getPostsByProject(project: Project): Post[] {
  return getPublishedPosts().filter((post) => post.project === project.slug);
}

export function getProjectPostCount(project: Project) {
  return project.postCount ?? getPostsByProject(project).length;
}
