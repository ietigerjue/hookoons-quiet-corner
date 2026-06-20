import { useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown";

export function MarkdownRenderer({
  markdown,
  className = "prose-blog",
  headingIds = false,
}: {
  markdown: string;
  className?: string;
  headingIds?: boolean;
}) {
  const html = useMemo(() => renderMarkdown(markdown, { headingIds }), [headingIds, markdown]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
