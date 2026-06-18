import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TagBar } from "@/components/site/TagBar";
import { ArticleCard } from "@/components/site/ArticleCard";
import { POSTS } from "@/lib/posts";

export const Route = createFileRoute("/posts/")({
  head: () => ({
    meta: [
      { title: "Posts — Hookoon's Blog" },
      {
        name: "description",
        content: "All long-form posts on AI, materials science, product building, and personal notes.",
      },
      { property: "og:title", content: "Posts — Hookoon's Blog" },
      { property: "og:description", content: "All long-form posts and notes." },
    ],
  }),
  component: PostsPage,
});

function PostsPage() {
  const [tag, setTag] = useState("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return POSTS.filter((p) => {
      const tagOk = tag === "All" || p.tags.includes(tag);
      if (!needle) return tagOk;
      const hay = (p.title + " " + p.excerpt + " " + p.tags.join(" ")).toLowerCase();
      return tagOk && hay.includes(needle);
    });
  }, [tag, q]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <header className="max-w-2xl fade-up">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          The Library
        </div>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
          All posts
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">
          Long-form notes, experiments, and project logs. Search by keyword or filter by topic.
        </p>
      </header>

      <div className="mt-8 fade-up">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts…"
            className="w-full rounded-full border border-border bg-secondary py-2.5 pl-9 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background focus:outline-none"
          />
        </div>
        <div className="mt-5">
          <TagBar active={tag} onChange={setTag} />
        </div>
      </div>

      <section className="mt-10">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
            No posts match your search.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {filtered.map((p) => (
              <ArticleCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
