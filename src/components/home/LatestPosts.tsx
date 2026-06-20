import { useMemo, useState } from "react";
import { TagFilter } from "@/components/blog/TagFilter";
import { PostCard } from "@/components/blog/PostCard";
import { POSTS } from "@/lib/posts";

export function LatestPosts() {
  const [tag, setTag] = useState("All");
  const featured = POSTS.find((post) => post.featured) ?? POSTS[0];
  const posts = useMemo(
    () =>
      POSTS.filter((post) => post.slug !== featured?.slug).filter(
        (post) => tag === "All" || post.tags.includes(tag),
      ),
    [featured?.slug, tag],
  );

  return (
    <>
      <section className="mt-10 fade-up">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Filter
            </div>
            <h2 className="mt-1 font-display text-2xl text-foreground">Browse by topic</h2>
          </div>
        </div>
        <TagFilter active={tag} onChange={setTag} />
      </section>

      {POSTS.length === 0 ? (
        <section className="mt-10 fade-up">
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm leading-relaxed text-muted-foreground sm:p-10">
            Published posts will appear here after the Obsidian workflow sends them to the blog.
          </div>
        </section>
      ) : null}

      {tag === "All" && featured ? (
        <section className="mt-10 fade-up">
          <PostCard post={featured} featured />
        </section>
      ) : null}

      <section className="mt-10 fade-up">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-foreground">Latest</h2>
          <span className="text-[13px] text-muted-foreground">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
            No posts under <span className="text-foreground">{tag}</span> yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
