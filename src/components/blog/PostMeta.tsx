import type { Post } from "@/lib/posts";
import { formatDate } from "@/lib/posts";
import { TagPill } from "@/components/blog/TagPill";

export function PostMeta({
  post,
  linkedTags = false,
}: {
  post: Pick<Post, "date" | "readingTime" | "tags">;
  linkedTags?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-muted-foreground">
      <span className="shrink-0">{formatDate(post.date)}</span>
      <span className="shrink-0 text-border">·</span>
      <span className="shrink-0">{post.readingTime} min read</span>
      <span className="flex w-full flex-wrap gap-1.5 sm:ml-auto sm:w-auto">
        {post.tags.map((tag) => (
          <TagPill key={tag} tag={tag} link={linkedTags} />
        ))}
      </span>
    </div>
  );
}
