import { ALL_TAGS } from "@/lib/posts";

export function TagFilter({
  active,
  onChange,
  tags = ALL_TAGS,
}: {
  active: string;
  onChange: (tag: string) => void;
  tags?: string[];
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max max-w-none items-center gap-2">
        {tags.map((tag) => {
          const selected = tag === active;
          return (
            <button
              key={tag}
              onClick={() => onChange(tag)}
              className={[
                "min-h-9 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition-all",
                selected
                  ? "border-foreground/80 bg-foreground text-background"
                  : "border-border bg-secondary text-muted-foreground hover:border-[color:var(--ink-faint)] hover:text-foreground",
              ].join(" ")}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
