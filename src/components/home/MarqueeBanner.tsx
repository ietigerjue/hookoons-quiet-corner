const ROWS: {
  words: string[];
  dir: "left" | "right";
  weight: "bold" | "regular";
  tone: "strong" | "soft" | "faint";
  duration: string;
  size: string;
}[] = [
  {
    words: ["AI AGENTS", "MATERIALS SCIENCE", "PRODUCT BUILDING", "RESEARCH NOTES"],
    dir: "left",
    weight: "bold",
    tone: "strong",
    duration: "70s",
    size: "text-[clamp(2rem,7vw,5rem)]",
  },
  {
    words: ["PERSONAL BLOG", "LONG-FORM THINKING", "HKUST MATE", "CODING JOURNAL"],
    dir: "right",
    weight: "regular",
    tone: "soft",
    duration: "90s",
    size: "text-[clamp(1.35rem,4.5vw,3.25rem)]",
  },
  {
    words: ["SYSTEMS THINKING", "LEARNING LOGS", "DESIGN NOTES", "BUILD IN PUBLIC"],
    dir: "left",
    weight: "regular",
    tone: "faint",
    duration: "110s",
    size: "text-[clamp(1.15rem,3vw,2rem)]",
  },
  {
    words: ["AI AGENTS", "RESEARCH NOTES", "PRODUCT BUILDING", "MATERIALS SCIENCE"],
    dir: "right",
    weight: "bold",
    tone: "soft",
    duration: "85s",
    size: "text-[clamp(2rem,5.5vw,4rem)]",
  },
  {
    words: ["LONG-FORM THINKING", "CODING JOURNAL", "HKUST MATE", "PERSONAL BLOG"],
    dir: "left",
    weight: "regular",
    tone: "faint",
    duration: "100s",
    size: "text-[clamp(1rem,2.5vw,1.75rem)]",
  },
];

const toneClass = {
  strong: "text-foreground",
  soft: "text-[color:var(--ink-soft)]",
  faint: "text-[color:var(--ink-faint)]",
};

function MarqueeRow({ words, dir, weight, tone, duration, size }: (typeof ROWS)[number]) {
  const line = (
    <div className="flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
      {words.concat(words).map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={[
            "font-display whitespace-nowrap leading-none tracking-tight",
            size,
            weight === "bold" ? "font-semibold" : "font-normal",
            toneClass[tone],
          ].join(" ")}
        >
          {word}
          <span className="ml-8 text-border sm:ml-12">/</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden py-1 sm:py-2">
      <div
        className={
          dir === "left" ? "marquee-track-left flex w-max" : "marquee-track-right flex w-max"
        }
        style={{ ["--marquee-duration" as string]: duration }}
      >
        {line}
        {line}
      </div>
    </div>
  );
}

export function MarqueeBanner() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-0 py-4 sm:gap-1 sm:py-6">
      {ROWS.map((row, index) => (
        <MarqueeRow key={index} {...row} />
      ))}
    </div>
  );
}
