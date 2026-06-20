import { Link } from "@tanstack/react-router";

type TagPillProps = {
  tag: string;
  active?: boolean;
  onClick?: () => void;
  link?: boolean;
};

export function TagPill({ tag, active = false, onClick, link = false }: TagPillProps) {
  const className = [
    "inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] leading-relaxed transition-colors",
    active
      ? "border-foreground/80 bg-foreground text-background"
      : "border-border bg-secondary text-muted-foreground hover:text-foreground",
  ].join(" ");

  if (link) {
    return (
      <Link to="/tags" className={className}>
        {tag}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {tag}
      </button>
    );
  }

  return <span className={className}>{tag}</span>;
}
