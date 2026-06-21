import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TagFilter } from "@/components/blog/TagFilter";
import { PostCard } from "@/components/blog/PostCard";
import { POSTS } from "@/lib/posts";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () =>
    buildSeo({
      title: "Blog",
      description:
        "Essays, project logs, and notes on AI agents, personal projects, materials learning, price action, and long-term thinking. 这里记录 AI Agent、个人项目、材料学习、价格行为学笔记与长期思考。",
      path: "/blog",
    }),
  component: BlogPage,
});

function BlogPage() {
  const [tag, setTag] = useState("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return POSTS.filter((p) => {
      const tagOk = tag === "All" || p.tags.includes(tag);
      if (!needle) return tagOk;
      const hay = (
        p.title +
        " " +
        (p.titleEn ?? "") +
        " " +
        p.excerpt +
        " " +
        p.tags.join(" ")
      ).toLowerCase();
      return tagOk && hay.includes(needle);
    });
  }, [tag, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-14">
      <header className="max-w-2xl fade-up">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Published Notes
        </div>
        <h1 className="mt-2 font-display text-[2.5rem] leading-tight tracking-tight text-foreground sm:text-5xl">
          Blog
        </h1>
        <p className="mt-3 space-y-1 text-[15.5px] leading-relaxed text-muted-foreground">
          <span className="block">
            Essays, project logs, and notes on AI agents, personal projects, materials learning,
            price action, and long-term thinking.
          </span>
          <span className="block">
            这里记录 AI Agent、个人项目、材料学习、价格行为学笔记与长期思考。
          </span>
        </p>
      </header>

      <div className="mt-8 fade-up">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search blog..."
            className="min-h-11 w-full rounded-full border border-border bg-secondary py-2.5 pl-9 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background focus:outline-none"
          />
        </div>
        <div className="mt-5">
          <TagFilter active={tag} onChange={setTag} />
        </div>
      </div>

      <section className="mt-10">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm leading-relaxed text-muted-foreground sm:p-10">
            No posts match your search.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {filtered.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
