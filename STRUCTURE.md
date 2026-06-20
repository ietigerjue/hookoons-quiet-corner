# Project Structure

This project is a Lovable-generated TanStack Start + React + Vite + TypeScript blog. It keeps TanStack file routes in `src/routes` and uses Tailwind CSS v4 through `src/styles.css`.

## Current Directory Structure

```text
src/
├─ components/
│  ├─ blog/
│  │  ├─ MarkdownRenderer.tsx
│  │  ├─ PostCard.tsx
│  │  ├─ PostMeta.tsx
│  │  ├─ TagFilter.tsx
│  │  └─ TagPill.tsx
│  ├─ home/
│  │  ├─ HeroSection.tsx
│  │  ├─ LatestPosts.tsx
│  │  └─ MarqueeBanner.tsx
│  ├─ layout/
│  │  ├─ Footer.tsx
│  │  ├─ Header.tsx
│  │  └─ SiteShell.tsx
│  ├─ projects/
│  │  └─ ProjectCard.tsx
│  └─ ui/
├─ content/
│  ├─ posts/
│  │  ├─ README.md
│  │  ├─ YYYY-MM-DD-slug.md
│  │  └─ posts.ts
│  └─ projects/
│     ├─ README.md
│     └─ projects.ts
├─ hooks/
├─ lib/
│  ├─ posts.ts
│  ├─ projects.ts
│  ├─ seo.ts
│  └─ utils.ts
├─ routes/
├─ styles/
│  └─ README.md
├─ router.tsx
├─ routeTree.gen.ts
├─ server.ts
├─ start.ts
└─ styles.css
```

## Directory Purposes

- `src/routes/`: TanStack Start file routes. Add new pages here and let TanStack regenerate route metadata during dev/build.
- `src/components/layout/`: site-wide shell components such as header, footer, and the shared app frame.
- `src/components/home/`: homepage-only sections, including the Lovable marquee hero and latest-post feed.
- `src/components/blog/`: reusable blog primitives such as post cards, post metadata, tag controls, and markdown rendering.
- `src/components/projects/`: project display components for future portfolio/project pages.
- `src/components/ui/`: shadcn/ui-style generated primitives. Keep these available; do not remove them during routine feature work.
- `src/content/posts/`: deployable Markdown posts published from Obsidian. `posts.ts` remains only as historical seed data.
- `src/content/projects/`: project metadata for future project pages.
- `src/lib/`: typed access helpers, formatting functions, SEO helpers, and cross-feature utilities.
- `src/styles.css`: global Tailwind v4 theme and prose styles. This remains at the root of `src` because the root route imports it directly.
- `src/styles/`: documentation and future non-global style modules.

## Adding New Articles

Write source notes in Obsidian, then publish them into `src/content/posts/` with:

```bash
npm run publish:obsidian -- "YYYY-MM-DD-slug.md"
```

Manual posts may also be added directly as Markdown files under `src/content/posts/`. Keep parsing/query helpers in `src/lib/posts.ts`. Routes should import from `src/lib/posts.ts`, not directly from raw content files.

## Adding New Pages

Add new route files under `src/routes/` using TanStack Start conventions:

- `src/routes/projects.tsx` for `/projects`
- `src/routes/projects.$slug.tsx` for `/projects/$slug`
- `src/routes/notes.tsx` for `/notes`

Keep route files focused on route metadata, loaders, and page composition. Move repeated JSX into `src/components/*`.

## Component Split Principles

1. Route files compose pages; they should not own reusable UI markup.
2. Layout components are shared across all routes and live in `components/layout`.
3. Homepage-only visual sections live in `components/home`.
4. Blog primitives live in `components/blog` and should be reused by `/`, `/blog`, `/blog/$slug`, and future content pages.
5. Static content and seed data live under `src/content`; helper functions and formatting stay in `src/lib`.
6. shadcn/ui generated primitives stay in `components/ui`; only wrap them with feature components when product behavior requires it.
7. Preserve the Lovable visual language: warm neutral palette, editorial display type, marquee hero, rounded cards, and quiet borders.
