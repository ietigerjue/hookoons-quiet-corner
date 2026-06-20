import type { Project } from "@/content/projects/projects";
import { TagPill } from "@/components/blog/TagPill";

export function ProjectCard({ project }: { project: Project }) {
  const content = (
    <>
      <h3 className="break-words font-display text-xl leading-tight text-foreground">
        {project.title}
      </h3>
      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden">
        {project.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <TagPill key={tag} tag={tag} />
        ))}
      </div>
    </>
  );

  if (project.href) {
    return (
      <a
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block min-w-0 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-[color:var(--ink-faint)] focus-visible:border-[color:var(--ink-faint)]"
      >
        {content}
      </a>
    );
  }

  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card p-5">{content}</article>
  );
}
