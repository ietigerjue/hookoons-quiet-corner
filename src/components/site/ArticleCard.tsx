import { Link } from "@tanstack/react-router";
import type { Post } from "@/lib/posts";
import { formatDate } from "@/lib/posts";

export function ArticleCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <Link
      to="/posts/$slug"
      params={{ slug: post.slug }}
      className={[
        "group block rounded-2xl border border-border bg-card p-6 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-[color:var(--ink-faint)] hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.18)]",
        featured ? "sm:p-8" : "",
      ].join(" ")}
    >
      {featured && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="h-1 w-1 rounded-full bg-foreground" /> Featured
        </div>
      )}
      <h3
        className={[
          "font-display tracking-tight text-foreground",
          featured ? "text-3xl sm:text-4xl" : "text-xl sm:text-[22px]",
          "leading-[1.15]",
        ].join(" ")}
      >
        {post.title}
      </h3>
      <p
        className={[
          "mt-3 text-muted-foreground",
          featured ? "text-[15.5px] leading-relaxed" : "text-[14.5px] leading-relaxed",
        ].join(" ")}
      >
        {post.excerpt}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-muted-foreground">
        <span>{formatDate(post.date)}</span>
        <span className="text-border">·</span>
        <span>{post.readingTime} min read</span>
        <span className="ml-auto flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </span>
      </div>
    </Link>
  );
}
