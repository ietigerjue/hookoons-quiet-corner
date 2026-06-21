import { createFileRoute } from "@tanstack/react-router";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getProjectPostCount, PROJECTS } from "@/lib/projects";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/projects/")({
  head: () =>
    buildSeo({
      title: "Projects",
      description:
        "Long-running project series for Price Action reviews, AI agent workflows, blog engineering, and materials learning. 长期专题与系列入口，包括价格行为复盘、AI Agent 工作流、博客工程化和材料学习。",
      path: "/projects",
    }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-14">
      <header className="max-w-2xl fade-up">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Project Series
        </div>
        <h1 className="mt-2 font-display text-[2.5rem] leading-tight tracking-tight text-foreground sm:text-5xl">
          Projects
        </h1>
        <p className="mt-3 space-y-1 text-[15.5px] leading-relaxed text-muted-foreground">
          <span className="block">
            Long-running project series for Price Action reviews, AI agent workflows, blog
            engineering, and materials learning.
          </span>
          <span className="block">
            长期专题与系列入口，包括价格行为复盘、AI Agent 工作流、博客工程化和材料学习。
          </span>
        </p>
      </header>

      <section className="mt-10">
        {PROJECTS.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-sm leading-relaxed text-muted-foreground sm:p-10">
            Project notes will appear here as the blog workflow grows.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {PROJECTS.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                postCount={getProjectPostCount(project)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
