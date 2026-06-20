import { createFileRoute } from "@tanstack/react-router";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { PROJECTS } from "@/lib/projects";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/projects")({
  head: () =>
    buildSeo({
      title: "Projects",
      description: "Hookoon 的个人项目记录，包括 AI Agent、博客工程化、工作流和学习系统。",
      path: "/projects",
    }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-14">
      <header className="max-w-2xl fade-up">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Project Logs
        </div>
        <h1 className="mt-2 font-display text-[2.5rem] leading-tight tracking-tight text-foreground sm:text-5xl">
          Projects
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">
          Hookoon 的个人项目记录，包括 AI Agent、博客工程化、工作流和学习系统。
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
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
