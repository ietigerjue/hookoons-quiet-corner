export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
  readingTime: number;
  cover?: string;
  featured?: boolean;
  content: string;
};

export const ALL_TAGS = [
  "All",
  "AI",
  "Agent",
  "Blog",
  "Materials Science",
  "Research",
  "Product",
  "Coding",
  "Life",
  "HKUST",
  "Notes",
];

const sampleContent = (intro: string) => `
${intro}

## Why this matters

I keep returning to the idea that good writing is a way of *seeing*. When I write about a project, I notice what I actually believe about it — not what I rehearsed in conversation. That gap is usually where the interesting work lives.

> The most underrated tool for thinking clearly is a slow, quiet page.

### A short list of things I'm trying

- Writing one structured note per project per week
- Treating every essay as an experiment, not a performance
- Keeping a separate file for half-formed ideas
- Re-reading my old notes monthly

## A small code example

\`\`\`ts
function distill(notes: string[]): string {
  return notes
    .map((n) => n.trim())
    .filter(Boolean)
    .join("\\n\\n");
}
\`\`\`

## Comparison table

| Approach        | Speed   | Depth  |
| --------------- | ------- | ------ |
| Quick tweet     | Fast    | Low    |
| Working note    | Medium  | Medium |
| Long-form essay | Slow    | High   |

I'll keep refining the workflow as I learn. If you'd like to follow along, the rest of this blog is the long form of that experiment.
`;

export const POSTS: Post[] = [
  {
    slug: "why-i-built-this-blog",
    title: "Why I Built This Blog",
    excerpt:
      "A quiet corner of the internet for structured notes, project logs, and the slow kind of thinking I keep missing in feeds.",
    tags: ["Blog", "Notes", "Product"],
    date: "2026-06-02",
    readingTime: 6,
    featured: true,
    content: sampleContent(
      "I built this blog because I wanted a place that rewards slowness. Most of what I read online is optimized for the scroll, and most of what I want to write doesn't fit that shape."
    ),
  },
  {
    slug: "first-month-exploring-ai-agents",
    title: "My First Month Exploring AI Agents",
    excerpt:
      "Notes from a month of building small agents — what surprised me, what broke, and the patterns that actually generalize.",
    tags: ["AI", "Agent", "Coding"],
    date: "2026-05-24",
    readingTime: 9,
    content: sampleContent(
      "After a month of building small agents end-to-end, the thing that surprised me most wasn't the models. It was how much of the work is plumbing — context, memory, tool boundaries, and patient evaluation."
    ),
  },
  {
    slug: "materials-science-and-ml",
    title: "Notes on Materials Science and Machine Learning",
    excerpt:
      "Where the two fields actually meet — featurization, datasets, and the quiet pragmatism of working with messy lab data.",
    tags: ["Materials Science", "Research", "AI"],
    date: "2026-05-10",
    readingTime: 11,
    content: sampleContent(
      "The intersection of materials science and machine learning isn't really about flashy architectures. It's about taking small, messy datasets seriously and asking what you can actually learn from them."
    ),
  },
  {
    slug: "personal-knowledge-system",
    title: "Building a Personal Knowledge System",
    excerpt:
      "How I keep notes, projects, and references in one calm place — and the small habits that make it actually stick.",
    tags: ["Notes", "Life", "Product"],
    date: "2026-04-28",
    readingTime: 7,
    content: sampleContent(
      "Every productivity system collapses the moment it asks too much of you. The one I use now works because I stripped it back to three pages and a weekly review."
    ),
  },
  {
    slug: "hkust-mate-prep-log",
    title: "HKUST MATE Preparation Log",
    excerpt:
      "An ongoing log of how I'm preparing for HKUST's MATE program — readings, side projects, and the questions I keep returning to.",
    tags: ["HKUST", "Materials Science", "Life"],
    date: "2026-04-12",
    readingTime: 5,
    content: sampleContent(
      "This is a living document. I'll keep adding to it as I work through the readings and projects that brought me to HKUST's MATE program in the first place."
    ),
  },
  {
    slug: "codex-project-workflows",
    title: "How I Use Codex for Project Workflows",
    excerpt:
      "A practical look at how I weave Codex into the small loops of building — refactors, tests, and the boring tasks that compound.",
    tags: ["Coding", "Agent", "Product"],
    date: "2026-03-30",
    readingTime: 8,
    content: sampleContent(
      "Codex earns its keep in the small loops: writing the second test, naming the awkward variable, rewriting a function I already know how to write but don't want to."
    ),
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function adjacentPosts(slug: string) {
  const idx = POSTS.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? POSTS[idx - 1] : null,
    next: idx >= 0 && idx < POSTS.length - 1 ? POSTS[idx + 1] : null,
  };
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
