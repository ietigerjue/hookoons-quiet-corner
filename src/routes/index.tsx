import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ScrollingBanner } from "@/components/site/ScrollingBanner";
import { TagBar } from "@/components/site/TagBar";
import { ArticleCard } from "@/components/site/ArticleCard";
import { POSTS } from "@/lib/posts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hookoon's Blog — Notes on AI, Materials Science & Product Building" },
      {
        name: "description",
        content:
          "A personal blog on AI agents, materials science, product building, and long-form thinking.",
      },
      { property: "og:title", content: "Hookoon's Blog" },
      {
        property: "og:description",
        content: "Notes on AI, Materials Science, Product Building, and Personal Growth.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [tag, setTag] = useState("All");

  const featured = POSTS.find((p) => p.featured) ?? POSTS[0];
  const rest = useMemo(
    () =>
      POSTS.filter((p) => p.slug !== featured.slug).filter(
        (p) => tag === "All" || p.tags.includes(tag),
      ),
    [tag, featured.slug],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <div className="fade-up">
        <ScrollingBanner />
      </div>

      <section className="mt-10 fade-up">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Filter
            </div>
            <h2 className="mt-1 font-display text-2xl text-foreground">Browse by topic</h2>
          </div>
        </div>
        <TagBar active={tag} onChange={setTag} />
      </section>

      {tag === "All" && (
        <section className="mt-10 fade-up">
          <ArticleCard post={featured} featured />
        </section>
      )}

      <section className="mt-10 fade-up">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-foreground">Latest</h2>
          <span className="text-[13px] text-muted-foreground">
            {rest.length} {rest.length === 1 ? "post" : "posts"}
          </span>
        </div>
        {rest.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
            No posts under <span className="text-foreground">{tag}</span> yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {rest.map((p) => (
              <ArticleCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
