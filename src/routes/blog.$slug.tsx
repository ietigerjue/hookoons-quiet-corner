import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PostMeta } from "@/components/blog/PostMeta";
import { adjacentPosts, bilingualTitle, getPostBySlug } from "@/lib/posts";
import { extractTOC } from "@/lib/markdown";
import { buildPostSeo } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => (loaderData ? buildPostSeo(loaderData.post) : { meta: [], links: [] }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-5 sm:py-24">
      <h1 className="font-display text-4xl leading-tight text-foreground">Post not found</h1>
      <p className="mt-3 text-muted-foreground">
        This article may still be a draft or may have moved.
      </p>
      <Link to="/blog" className="mt-6 inline-block text-sm underline">
        ← Back to blog
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground sm:px-5 sm:py-24">
      Something went wrong loading this post. {error.message}
    </div>
  ),
  component: BlogPostDetail,
});

function BlogPostDetail() {
  const { post } = Route.useLoaderData();
  const { prev, next } = adjacentPosts(post.slug);
  const toc = extractTOC(post.content);

  return (
    <article className="mx-auto max-w-6xl overflow-hidden px-4 py-8 sm:px-5 sm:py-16">
      <Link
        to="/blog"
        className="inline-flex min-h-9 items-center rounded-md text-[13px] text-muted-foreground hover:text-foreground"
      >
        ← All blog posts
      </Link>

      <div className="mt-6 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,760px)_220px] lg:gap-12">
        <div className="min-w-0">
          <header className="fade-up">
            <PostMeta post={post} linkedTags />
            <h1 className="mt-4 text-balance break-words font-display text-[clamp(2rem,11vw,3.5rem)] font-medium leading-[1.1] tracking-tight text-foreground">
              {post.title}
            </h1>
            {post.titleEn ? (
              <p className="mt-3 break-words font-display text-[clamp(1.25rem,6vw,2rem)] leading-tight text-muted-foreground">
                {post.titleEn}
              </p>
            ) : null}
            <p className="mt-5 text-[16.5px] leading-relaxed text-muted-foreground sm:text-[18px]">
              {post.excerpt}
            </p>
          </header>

          {post.cover ? (
            <img
              src={post.cover}
              alt={post.title}
              className="mt-8 aspect-[16/9] w-full rounded-2xl border border-border object-cover sm:mt-10 sm:aspect-[16/8]"
            />
          ) : null}

          <MarkdownRenderer
            markdown={post.content}
            headingIds
            className="prose-blog mt-10 fade-up sm:mt-12"
          />

          <nav className="mt-16 grid gap-4 border-t border-border pt-8 sm:mt-20 sm:grid-cols-2 sm:pt-10">
            {prev ? (
              <Link
                to="/blog/$slug"
                params={{ slug: prev.slug }}
                className="group min-w-0 rounded-xl border border-border bg-card p-5 transition-colors hover:border-[color:var(--ink-faint)]"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  <ArrowLeft className="h-3 w-3" /> Previous
                </div>
                <div className="mt-2 break-words font-display text-lg text-foreground">
                  {bilingualTitle(prev)}
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                to="/blog/$slug"
                params={{ slug: next.slug }}
                className="group min-w-0 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-[color:var(--ink-faint)] sm:text-right"
              >
                <div className="flex items-center justify-end gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Next <ArrowRight className="h-3 w-3" />
                </div>
                <div className="mt-2 break-words font-display text-lg text-foreground">
                  {bilingualTitle(next)}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              On this page
            </div>
            <ul className="mt-3 space-y-2 border-l border-border pl-4 text-[13.5px]">
              {toc.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </article>
  );
}
