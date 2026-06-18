import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/write")({
  head: () => ({
    meta: [
      { title: "Write — Hookoon's Blog" },
      { name: "description", content: "Draft a new blog post with markdown and live preview." },
    ],
  }),
  component: WritePage,
});

const MAX_TAGS = 8;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function WritePage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [body, setBody] = useState(
    "## Start writing\n\nThis is a live preview of your post. Markdown headings, **bold**, *italic*, `code`, lists, and blockquotes are supported.\n\n- Idea one\n- Idea two\n\n> A great post starts as a draft you weren't afraid to write.\n",
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const effectiveSlug = slug || slugify(title) || "untitled";

  function addTag(raw: string) {
    const t = raw.trim();
    if (!t) return;
    if (tags.includes(t)) {
      toast("Tag already added");
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast("You can add up to 8 tags");
      return;
    }
    setTags([...tags, t]);
    setTagDraft("");
  }

  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  function handleFile(file?: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCover(url);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0]);
  }

  const previewHtml = useMemo(() => quickMarkdown(body), [body]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center fade-up">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            New entry
          </div>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Write a post
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.success("Draft saved locally")}
            className="rounded-full border border-border bg-secondary px-4 py-2 text-[13.5px] text-foreground transition-colors hover:bg-accent"
          >
            Save draft
          </button>
          <button
            onClick={() =>
              toast.success(`Published "${title || "Untitled"}" — prototype only`)
            }
            className="rounded-full bg-foreground px-4 py-2 text-[13.5px] text-background transition-opacity hover:opacity-90"
          >
            Publish
          </button>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Editor */}
        <section className="space-y-5">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The post title"
              className="w-full bg-transparent font-display text-2xl tracking-tight text-foreground placeholder:text-[color:var(--ink-faint)] focus:outline-none"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Slug">
              <input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder={slugify(title) || "auto-generated"}
                className="w-full bg-transparent text-[14.5px] text-foreground placeholder:text-[color:var(--ink-faint)] focus:outline-none"
              />
            </Field>
            <Field label="Tags (Enter to add)">
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[12px] text-foreground"
                  >
                    {t}
                    <button
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${t}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={onTagKey}
                  placeholder={tags.length ? "" : "AI, Notes, …"}
                  className="min-w-[80px] flex-1 bg-transparent text-[13.5px] focus:outline-none"
                />
              </div>
            </Field>
          </div>

          <Field label="Excerpt">
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A one or two-sentence summary."
              rows={2}
              className="w-full resize-none bg-transparent text-[14.5px] leading-relaxed text-foreground placeholder:text-[color:var(--ink-faint)] focus:outline-none"
            />
          </Field>

          <Field label="Cover image">
            {cover ? (
              <div className="group relative overflow-hidden rounded-xl border border-border">
                <img src={cover} alt="Cover preview" className="block h-56 w-full object-cover" />
                <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full bg-background/90 px-3 py-1 text-[12px] text-foreground"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => setCover(null)}
                    className="rounded-full bg-background/90 px-3 py-1 text-[12px] text-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-[color:var(--ink-faint)] hover:text-foreground"
              >
                <ImagePlus className="h-6 w-6" />
                <div className="text-[13.5px]">Click or drag an image to upload</div>
                <div className="text-[11.5px] text-[color:var(--ink-faint)]">PNG, JPG up to 5MB</div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </Field>

          <Field label="Body (Markdown)">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              className="w-full resize-y bg-transparent font-mono text-[13.5px] leading-relaxed text-foreground focus:outline-none"
            />
          </Field>
        </section>

        {/* Preview */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Live preview
            </div>
            <div className="mt-4">
              {cover && (
                <img
                  src={cover}
                  alt=""
                  className="mb-5 h-40 w-full rounded-lg object-cover"
                />
              )}
              <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
                {title || "Untitled post"}
              </h2>
              <div className="mt-1 text-[12px] text-muted-foreground">
                /posts/{effectiveSlug}
              </div>
              {excerpt && (
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
                  {excerpt}
                </p>
              )}
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div
                className="prose-blog mt-6"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function quickMarkdown(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  const lines = md.split("\n");
  let html = "";
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith("```")) {
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
    if (l.startsWith("## ")) { html += `<h2>${inline(l.slice(3))}</h2>`; i++; continue; }
    if (l.startsWith("### ")) { html += `<h3>${inline(l.slice(4))}</h3>`; i++; continue; }
    if (l.startsWith("> ")) { html += `<blockquote>${inline(l.slice(2))}</blockquote>`; i++; continue; }
    if (/^[-*] /.test(l)) {
      let items = "";
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items += `<li>${inline(lines[i].slice(2))}</li>`;
        i++;
      }
      html += `<ul>${items}</ul>`;
      continue;
    }
    if (l.trim() === "") { i++; continue; }
    let para = l; i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#|>|`{3}|[-*] )/.test(lines[i])) {
      para += " " + lines[i]; i++;
    }
    html += `<p>${inline(para)}</p>`;
  }
  return html;
}
