import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { adjacentPosts, formatDate, getPost, POSTS } from "@/lib/posts";

export const Route = createFileRoute("/posts/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.post.title} — Hookoon's Blog` },
          { name: "description", content: loaderData.post.excerpt },
          { property: "og:title", content: loaderData.post.title },
          { property: "og:description", content: loaderData.post.excerpt },
          { property: "og:type", content: "article" },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-display text-4xl text-foreground">Post not found</h1>
      <p className="mt-3 text-muted-foreground">This article may have moved or been removed.</p>
      <Link to="/posts" className="mt-6 inline-block text-sm underline">
        ← Back to posts
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center text-muted-foreground">
      Something went wrong loading this post. {error.message}
    </div>
  ),
  component: PostDetail,
});

function renderMarkdown(md: string): string {
  // Minimal markdown renderer for the prototype (headings, code, blockquote, lists, tables, paragraphs)
  const lines = md.split("\n");
  let html = "";
  let i = 0;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      i++;
      let code = "";
      while (i < lines.length && !lines[i].startsWith("```")) {
        code += lines[i] + "\n";
        i++;
      }
      i++;
      html += `<pre><code>${esc(code.trimEnd())}</code></pre>`;
      continue;
    }
    if (line.startsWith("## ")) {
      html += `<h2>${inline(line.slice(3))}</h2>`;
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      html += `<h3>${inline(line.slice(4))}</h3>`;
      i++;
      continue;
    }
    if (line.startsWith("> ")) {
      let q = line.slice(2);
      i++;
      while (i < lines.length && lines[i].startsWith("> ")) {
        q += " " + lines[i].slice(2);
        i++;
      }
      html += `<blockquote>${inline(q)}</blockquote>`;
      continue;
    }
    if (/^[-*] /.test(line)) {
      let items = "";
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items += `<li>${inline(lines[i].slice(2))}</li>`;
        i++;
      }
      html += `<ul>${items}</ul>`;
      continue;
    }
    if (line.startsWith("|") && lines[i + 1]?.includes("---")) {
      const header = line.split("|").slice(1, -1).map((c) => `<th>${inline(c.trim())}</th>`).join("");
      i += 2;
      let body = "";
      while (i < lines.length && lines[i].startsWith("|")) {
        const row = lines[i].split("|").slice(1, -1).map((c) => `<td>${inline(c.trim())}</td>`).join("");
        body += `<tr>${row}</tr>`;
        i++;
      }
      html += `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    // paragraph: collect until blank
    let para = line;
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith(">") && !lines[i].startsWith("```") && !/^[-*] /.test(lines[i]) && !lines[i].startsWith("|")) {
      para += " " + lines[i];
      i++;
    }
    html += `<p>${inline(para)}</p>`;
  }
  return html;
}

function extractTOC(md: string) {
  return md
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => {
      const text = l.slice(3).trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return { id, text };
    });
}

function PostDetail() {
  const { post } = Route.useLoaderData();
  const { prev, next } = adjacentPosts(post.slug);
  const [html, setHtml] = useState<string>("");
  const toc = extractTOC(post.content);

  useEffect(() => {
    const rendered = renderMarkdown(post.content).replace(
      /<h2>([^<]+)<\/h2>/g,
      (_m: string, t: string) => {
        const id = String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return `<h2 id="${id}">${t}</h2>`;
      },
    );
    setHtml(rendered);
  }, [post.content]);

  return (
    <article className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
      <Link to="/posts" className="text-[13px] text-muted-foreground hover:text-foreground">
        ← All posts
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,760px)_220px]">
        <div>
          <header className="fade-up">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
              <span>{formatDate(post.date)}</span>
              <span className="text-border">·</span>
              <span>{post.readingTime} min read</span>
              <span className="ml-1 flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    to="/tags"
                    className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {t}
                  </Link>
                ))}
              </span>
            </div>
            <h1 className="mt-4 font-display text-[clamp(2.2rem,4.5vw,3.5rem)] font-medium leading-[1.08] tracking-tight text-foreground">
              {post.title}
            </h1>
            <p className="mt-5 text-[18px] leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          </header>

          <div className="mt-10 aspect-[16/8] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[color:var(--paper)] via-[color:var(--muted)] to-[color:var(--accent)]">
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-[10vw] leading-none tracking-tight text-foreground/10 sm:text-[7vw]">
                {post.title.split(" ").slice(0, 2).join(" ")}
              </span>
            </div>
          </div>

          <div
            className="prose-blog mt-12 fade-up"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <nav className="mt-20 grid gap-4 border-t border-border pt-10 sm:grid-cols-2">
            {prev ? (
              <Link
                to="/posts/$slug"
                params={{ slug: prev.slug }}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-[color:var(--ink-faint)]"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  <ArrowLeft className="h-3 w-3" /> Previous
                </div>
                <div className="mt-2 font-display text-lg text-foreground">{prev.title}</div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                to="/posts/$slug"
                params={{ slug: next.slug }}
                className="group rounded-xl border border-border bg-card p-5 text-right transition-colors hover:border-[color:var(--ink-faint)]"
              >
                <div className="flex items-center justify-end gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Next <ArrowRight className="h-3 w-3" />
                </div>
                <div className="mt-2 font-display text-lg text-foreground">{next.title}</div>
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

// Keep POSTS referenced so Vite tree-shaking preserves it (also for potential future related-posts)
void POSTS;
