const ROWS: { words: string[]; dir: "left" | "right"; weight: "bold" | "regular"; tone: "strong" | "soft" | "faint"; duration: string }[] = [
  { words: ["AI AGENTS", "MATERIALS SCIENCE", "PRODUCT BUILDING", "RESEARCH NOTES"], dir: "left", weight: "bold", tone: "strong", duration: "70s" },
  { words: ["PERSONAL BLOG", "LONG-FORM THINKING", "HKUST MATE", "CODING JOURNAL"], dir: "right", weight: "regular", tone: "soft", duration: "90s" },
  { words: ["SYSTEMS THINKING", "LEARNING LOGS", "DESIGN NOTES", "BUILD IN PUBLIC"], dir: "left", weight: "regular", tone: "faint", duration: "110s" },
  { words: ["AI AGENTS", "RESEARCH NOTES", "PRODUCT BUILDING", "MATERIALS SCIENCE"], dir: "right", weight: "bold", tone: "soft", duration: "85s" },
  { words: ["LONG-FORM THINKING", "CODING JOURNAL", "HKUST MATE", "PERSONAL BLOG"], dir: "left", weight: "regular", tone: "faint", duration: "100s" },
];

const toneClass = {
  strong: "text-foreground",
  soft: "text-[color:var(--ink-soft)]",
  faint: "text-[color:var(--ink-faint)]",
};

function Row({ words, dir, weight, tone, duration }: (typeof ROWS)[number]) {
  // Duplicate enough to fill marquee; we render words×2 for seamless loop
  const line = (
    <div className="flex shrink-0 items-center gap-12 pr-12">
      {words.concat(words).map((w, i) => (
        <span
          key={i}
          className={[
            "font-display whitespace-nowrap",
            "text-[clamp(2.25rem,6vw,4.5rem)] leading-none tracking-tight",
            weight === "bold" ? "font-semibold" : "font-normal",
            toneClass[tone],
          ].join(" ")}
        >
          {w}
          <span className="ml-12 text-border">/</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden py-2">
      <div
        className={dir === "left" ? "marquee-track-left flex w-max" : "marquee-track-right flex w-max"}
        style={{ ["--marquee-duration" as string]: duration }}
      >
        {line}
        {line}
      </div>
    </div>
  );
}

export function ScrollingBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-[color:var(--paper)]">
      {/* Scrolling typography layer */}
      <div className="absolute inset-0 flex flex-col justify-center gap-1 py-6">
        {ROWS.map((r, i) => (
          <Row key={i} {...r} />
        ))}
      </div>

      {/* Translucent overlay so text feels like background */}
      <div className="pointer-events-none absolute inset-0 bg-background/55" />
      {/* Soft edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[color:var(--paper)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[color:var(--paper)] to-transparent" />

      {/* Foreground content */}
      <div className="relative z-10 grid gap-8 px-6 py-14 sm:px-12 sm:py-20 md:py-24">
        <div className="flex items-center gap-4">
          <div className="float-soft relative h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-background bg-secondary shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-105 sm:h-[88px] sm:w-[88px]">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--muted)] font-display text-2xl text-foreground sm:text-3xl">
              H
            </div>
          </div>
          <div className="text-[12px] uppercase tracking-[0.22em] text-muted-foreground">
            Vol. 01 · Personal Journal
          </div>
        </div>

        <div className="max-w-2xl">
          <h1 className="font-display text-[clamp(2.4rem,5.5vw,4.25rem)] font-medium leading-[1.02] tracking-[-0.02em] text-foreground">
            Hookoon&rsquo;s Blog
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-foreground/85 sm:text-[18.5px]">
            Notes on AI, Materials Science, Product Building, and Personal Growth.
          </p>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
            A quiet space for structured thinking, experiments, and long-form writing.
          </p>
        </div>
      </div>
    </section>
  );
}
