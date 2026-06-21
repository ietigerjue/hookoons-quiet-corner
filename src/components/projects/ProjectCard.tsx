import { Link } from "@tanstack/react-router";
import type { Project } from "@/content/projects/projects";
import { TagPill } from "@/components/blog/TagPill";

const statusLabel: Record<Project["status"], string> = {
  active: "Active",
  building: "Building",
  paused: "Paused",
};

export function ProjectCard({ project, postCount = 0 }: { project: Project; postCount?: number }) {
  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-display text-xl leading-tight text-foreground">
            {project.title}
          </h3>
          <p className="mt-1 break-words text-[14px] leading-snug text-muted-foreground">
            {project.titleZh}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {statusLabel[project.status]}
        </span>
      </div>
      <div className="mt-3 space-y-1 text-[14.5px] leading-relaxed text-muted-foreground">
        <p className="[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
          {project.description}
        </p>
        <p className="[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
          {project.descriptionZh}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <TagPill key={tag} tag={tag} />
        ))}
      </div>
      <div className="mt-5 text-[12.5px] text-muted-foreground">
        {postCount} {postCount === 1 ? "note" : "notes"} in this series
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
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="block min-w-0 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-[color:var(--ink-faint)] hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.18)] focus-visible:border-[color:var(--ink-faint)]"
    >
      {content}
    </Link>
  );
}
