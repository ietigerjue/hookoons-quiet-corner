import { MarqueeBanner } from "@/components/home/MarqueeBanner";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-[color:var(--paper)] sm:rounded-3xl">
      <MarqueeBanner />

      <div className="pointer-events-none absolute inset-0 bg-background/55" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[color:var(--paper)] to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[color:var(--paper)] to-transparent sm:w-24" />

      <div className="relative z-10 grid gap-7 px-5 py-11 sm:gap-8 sm:px-12 sm:py-20 md:py-24">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="float-soft relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-full border-2 border-background bg-secondary shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-105 sm:h-[88px] sm:w-[88px]">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--muted)] font-display text-2xl text-foreground sm:text-3xl">
              H
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[12px] sm:tracking-[0.22em]">
            Vol. 01 · Personal Journal
          </div>
        </div>

        <div className="max-w-2xl">
          <h1 className="text-balance font-display text-[clamp(2.25rem,12vw,4.25rem)] font-medium leading-[1.04] tracking-tight text-foreground">
            Hookoon&rsquo;s Blog
          </h1>
          <p className="mt-5 inline-block max-w-full bg-[#d9d6d0] px-3 py-1.5 text-[16px] leading-relaxed text-foreground/85 sm:text-[18.5px]">
            Notes on AI, Materials Science, Product Building, and Personal Growth.
          </p>
          <br />
          <p className="mt-2 inline-block max-w-xl bg-[#f0eeea] px-3 py-1.5 text-[14.5px] leading-relaxed text-muted-foreground">
            A quiet space for structured thinking, experiments, and long-form writing.
          </p>
        </div>
      </div>
    </section>
  );
}
