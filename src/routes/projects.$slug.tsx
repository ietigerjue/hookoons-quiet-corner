import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { TagPill } from "@/components/blog/TagPill";
import { getProjectBySlug, getPostsByProject } from "@/lib/projects";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const project = getProjectBySlug(params.slug);
    if (!project) throw notFound();
    return {
      project,
      posts: getPostsByProject(project),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? buildSeo({
          title: loaderData.project.title,
          description: `${loaderData.project.description} ${loaderData.project.descriptionZh}`,
          path: `/projects/${loaderData.project.slug}`,
        })
      : { meta: [], links: [] },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-5 sm:py-24">
      <h1 className="font-display text-4xl leading-tight text-foreground">Project not found</h1>
      <p className="mt-3 text-muted-foreground">This project series may have moved.</p>
      <Link to="/projects" className="mt-6 inline-block text-sm underline">
        ← Back to projects
      </Link>
    </div>
  ),
  component: ProjectSeriesPage,
});

function ProjectSeriesPage() {
  const { project, posts } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-14">
      <Link
        to="/projects"
        className="inline-flex min-h-9 items-center rounded-md text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        All project series
      </Link>

      <header className="mt-6 max-w-3xl fade-up">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Project Series
        </div>
        <h1 className="mt-2 text-balance break-words font-display text-[clamp(2.25rem,10vw,3.75rem)] font-medium leading-[1.08] tracking-tight text-foreground">
          {project.title}
        </h1>
        <p className="mt-2 break-words font-display text-[clamp(1.25rem,5vw,1.75rem)] leading-tight text-muted-foreground">
          {project.titleZh}
        </p>
        <div className="mt-5 space-y-2 text-[16px] leading-[1.75] text-muted-foreground sm:text-[17px]">
          <p>{project.description}</p>
          <p>{project.descriptionZh}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      </header>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-foreground">Notes in this series</h2>
            <p className="mt-1 text-sm text-muted-foreground">这个系列下的文章与复盘记录。</p>
          </div>
          <div className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
            {posts.length} {posts.length === 1 ? "note" : "notes"}
          </div>
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm leading-relaxed text-muted-foreground sm:p-8">
            <p className="font-medium text-foreground">
              No notes have been linked to this series yet.
            </p>
            <p className="mt-2">
              以后从 Obsidian 发布文章时，在 frontmatter
              加上下面这一行，这篇文章就会出现在本系列列表里：
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-card p-4 text-[12.5px] text-foreground">
              <code>{`project: ${project.slug}`}</code>
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
