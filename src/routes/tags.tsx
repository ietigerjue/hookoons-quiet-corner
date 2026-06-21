import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { POSTS, formatDate } from "@/lib/posts";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/tags")({
  head: () =>
    seo({
      title: "Tags",
      description:
        "Browse all topics and tags across the blog. 浏览博客里的所有主题标签，快速找到相关系列和文章。",
      path: "/tags",
    }),
  component: TagsPage,
});

function TagsPage() {
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    POSTS.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  const [active, setActive] = useState<string | null>(null);
  const related = active ? POSTS.filter((p) => p.tags.includes(active)) : [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <header className="max-w-2xl fade-up">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Index</div>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
          Tags
        </h1>
        <p className="mt-3 space-y-1 text-[15.5px] leading-relaxed text-muted-foreground">
          <span className="block">
            A topic-level view of everything written so far. Click a tag to see related posts.
          </span>
          <span className="block">按主题浏览目前发布的所有文章。点击标签可以查看相关内容。</span>
        </p>
      </header>

      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tagCounts.map(([t, count]) => {
          const selected = active === t;
          return (
            <button
              key={t}
              onClick={() => setActive(selected ? null : t)}
              className={[
                "flex items-center justify-between rounded-2xl border bg-card px-5 py-4 text-left transition-all",
                selected
                  ? "border-foreground/70 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.3)]"
                  : "border-border hover:-translate-y-0.5 hover:border-[color:var(--ink-faint)]",
              ].join(" ")}
            >
              <span className="font-display text-lg text-foreground">{t}</span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[12px] text-muted-foreground">
                {count}
              </span>
            </button>
          );
        })}
      </section>

      {active && (
        <section className="mt-12 fade-up">
          <h2 className="font-display text-2xl text-foreground">
            Posts in <span className="italic">{active}</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">该标签下的相关文章列表。</p>
          <ul className="mt-5 divide-y divide-border rounded-2xl border border-border bg-card">
            {related.map((p) => (
              <li key={p.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-display text-[17px] text-foreground">{p.title}</span>
                  <span className="text-[12.5px] text-muted-foreground">
                    {formatDate(p.date)} · {p.readingTime} min
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
