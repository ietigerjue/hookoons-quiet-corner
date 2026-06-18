import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Hookoon's Blog" },
      {
        name: "description",
        content:
          "About Hookoon — a writer on AI tools, agent workflows, materials science, and personal learning systems.",
      },
      { property: "og:title", content: "About — Hookoon's Blog" },
      {
        property: "og:description",
        content: "About Hookoon and what this blog is for.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header className="fade-up">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          About
        </div>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-tight text-foreground">
          Hi, I&rsquo;m Hookoon.
        </h1>
        <p className="mt-6 text-[18px] leading-relaxed text-muted-foreground">
          I write about AI tools, agent workflows, materials science, product building, and personal
          learning systems. This blog is where I keep structured notes, project logs, and long-form
          reflections.
        </p>
      </header>

      <section className="mt-14 grid gap-10">
        <Block title="Current focus">
          <p>
            Building small agent systems for everyday research, and preparing for the MATE program at
            HKUST. Most weeks I&rsquo;m oscillating between a code editor, a stack of papers, and a
            very long Notion page.
          </p>
        </Block>

        <Block title="Topics I write about">
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              "AI agents & workflows",
              "Materials Science",
              "Product building",
              "Research notes",
              "Coding journal",
              "Personal growth",
            ].map((t) => (
              <li
                key={t}
                className="rounded-xl border border-border bg-card px-4 py-3 text-[14.5px] text-foreground"
              >
                {t}
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Contact">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Email", href: "#" },
              { label: "Twitter / X", href: "#" },
              { label: "GitHub", href: "#" },
              { label: "RSS", href: "#" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-full border border-border bg-secondary px-4 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:border-[color:var(--ink-faint)] hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>
        </Block>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fade-up">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <div className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
