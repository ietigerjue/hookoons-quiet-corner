import { Link } from "@tanstack/react-router";
import type { Post } from "@/lib/posts";
import { PostMeta } from "@/components/blog/PostMeta";

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={[
        "group block min-w-0 rounded-2xl border border-border bg-card p-5 transition-all duration-300 sm:p-6",
        "hover:-translate-y-0.5 hover:border-[color:var(--ink-faint)] hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.18)] focus-visible:border-[color:var(--ink-faint)]",
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
          featured ? "text-[1.75rem] sm:text-4xl" : "text-xl sm:text-[22px]",
          "leading-[1.18] break-words",
        ].join(" ")}
      >
        {post.title}
      </h3>
      {post.titleEn ? (
        <p className="mt-1 break-words font-display text-[15px] leading-snug text-muted-foreground">
          {post.titleEn}
        </p>
      ) : null}
      <p
        className={[
          "mt-3 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden",
          featured ? "text-[15.5px] leading-relaxed" : "text-[14.5px] leading-relaxed",
        ].join(" ")}
      >
        {post.excerpt}
      </p>
      <div className="mt-5">
        <PostMeta post={post} />
      </div>
    </Link>
  );
}
