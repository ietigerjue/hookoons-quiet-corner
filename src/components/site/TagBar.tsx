import { ALL_TAGS } from "@/lib/posts";

export function TagBar({
  active,
  onChange,
  tags = ALL_TAGS,
}: {
  active: string;
  onChange: (t: string) => void;
  tags?: string[];
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max items-center gap-2">
        {tags.map((t) => {
          const selected = t === active;
          return (
            <button
              key={t}
              onClick={() => onChange(t)}
              className={[
                "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition-all",
                selected
                  ? "border-foreground/80 bg-foreground text-background"
                  : "border-border bg-secondary text-muted-foreground hover:border-[color:var(--ink-faint)] hover:text-foreground",
              ].join(" ")}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
