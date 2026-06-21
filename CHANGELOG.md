# Changelog

## 2026-06-20

### Added

- Added `docs/vercel-deployment.md` with Vercel project settings, environment variables, preview/production strategy, local Publisher boundaries, and troubleshooting.
- Added `docs/mobile-typography-checklist.md` for mobile and Markdown typography QA.
- Added draft Markdown style test content at `src/content/posts/2026-06-20-markdown-style-test.md`.
- Added a lightweight static Markdown test image at `public/images/markdown-style-test.svg`.
- Added unified SEO helpers for canonical URLs, Open Graph, Twitter Card metadata, and article SEO.
- Added build-time sitemap and robots generation from `VITE_SITE_URL`.
- Added `/projects` page and navigation entry.
- Added `public/images/README.md` documenting the default OG image location.

### Changed

- Enabled Nitro explicitly for self-hosted Vercel builds with `nitro: { preset: "vercel" }` in `vite.config.ts`.
- Ignored local `.vercel` build output.
- Expanded README deployment instructions and clarified Vercel-only versus local-only environment variables.
- Updated the home and about page descriptions to include Al Brooks-inspired price action notes.
- Improved mobile layout resilience for Header, Footer, Home, Blog list, Blog detail, Projects, About, cards, tag filters, and post metadata.
- Improved Chinese reading typography and Markdown rendering for headings, links, task lists, tables, images, inline code, code blocks, and long URLs.
- Updated the root HTML language to `zh-CN` and added CJK-friendly font fallbacks.
- Reading time estimation now counts CJK characters instead of relying only on whitespace-separated words.
- Draft posts can be opened in local development for layout testing while remaining hidden in production builds.
- About page contact links now point to GitHub, X, and 小红书.
- Sitemap generation now reads only process environment variables and no longer manually reads `.env.local`.
- Updated home, blog, post detail, projects, and about page metadata.
- Sitemap now includes published posts and excludes draft/unpublished posts.
- README now documents `VITE_SITE_URL` and Vercel environment variable setup.

## 2026-06-19

### Added

- Added a local Obsidian publishing script: `scripts/publish-obsidian-post.mjs`.
- Added `npm run publish:obsidian` for `Obsidian -> Markdown content -> build -> optional git push` publishing.
- Added `npm run publisher` and `npm run publisher:open` for the local Obsidian Blog Publisher Dashboard.
- Added `scripts/local-publisher-server.mjs` with token-protected local APIs and a browser dashboard bound to `127.0.0.1`.
- Added `scripts/lib/obsidian-publisher.mjs` so the CLI and Dashboard reuse one publishing pipeline.
- Added Soft/Hard Unpublish support in the local Dashboard and CLI.
- Added `npm run unpublish:post`.
- Added `docs/unpublish-workflow.md`.
- Added optional `titleEn` frontmatter support for bilingual blog post titles.
- Added relaxed Obsidian source filename support; the publisher now normalizes title-like filenames into stable blog slugs.
- Added repo-local Markdown posts under `src/content/posts/*.md`.
- Added `/blog` and `/blog/$slug` routes while preserving existing `/posts` routes.
- Added `docs/obsidian-publish-workflow.md`, `README.md`, and `.env.example`.

### Changed

- Switched runtime post loading to `import.meta.glob` over `src/content/posts/*.md`.
- Added post query helpers: `getAllPosts`, `getPublishedPosts`, `getPostBySlug`, `getAllTags`, `getPostsByTag`, `getTagCounts`, and `sortPostsByDate`.
- Improved Markdown rendering for h1/h2/h3, ordered lists, images, safe links, wiki-link fallback text, code blocks, and mobile-scrollable tables.
- Local Publisher Dashboard visible UI is now Chinese.
- Blog cards, detail pages, search, SEO title, and Dashboard rows display/search English titles when `titleEn` is present.

### Safety

- The publish script validates post filenames, required frontmatter, draft booleans, and image extensions.
- The script rewrites Obsidian image embeds and wiki links outside code fences.
- The publish script converts Markdown article links and Obsidian article wiki links to `/blog/slug`.
- The publish script strips local non-image file links while warning, so `file://` and local absolute paths do not reach published Markdown.
- `--deploy` is opt-in, runs build first, refuses unresolved conflicts or pre-staged files, and stages only this publish's generated article/images.
- The publish script now auto-loads repo-root `.env.local` without printing private values.
- The local publisher server refuses non-`127.0.0.1` host binding and protects all `/api/*` routes with `LOCAL_PUBLISHER_TOKEN`.
- Unpublish never deletes Obsidian source files, never rewrites Git history, and stages only affected published Markdown/image paths.

### Removed

- Removed local test publish article `src/content/posts/2026-06-18-test.md`.

## 2026-06-18

### Structured

- Reorganized Lovable prototype components into long-term feature folders:
  - `src/components/layout`
  - `src/components/home`
  - `src/components/blog`
  - `src/components/projects`
- Kept TanStack Start routes in `src/routes`.
- Moved seeded post data from `src/lib/posts.ts` to `src/content/posts/posts.ts`.
- Kept `src/lib/posts.ts` as the typed query/formatting layer.
- Extracted reusable blog primitives:
  - `PostCard`
  - `PostMeta`
  - `TagPill`
  - `TagFilter`
  - `MarkdownRenderer`
- Extracted homepage sections:
  - `HeroSection`
  - `MarqueeBanner`
  - `LatestPosts`
- Added future project/content scaffolding:
  - `src/content/projects`
  - `src/lib/projects.ts`
  - `src/components/projects/ProjectCard.tsx`
- Added `STRUCTURE.md` documenting the current directory layout and contribution rules.
- Removed the now-unused `src/components/site` folder after migrating its components.

### Fixed

- Standardized the project on npm package management.
- Removed Bun-specific package manager files (`bun.lock`, `bunfig.toml`) to avoid mixed package-manager detection locally or on Vercel.
- Added `packageManager: npm@11.12.1` to `package.json`.
- Added `start` and `typecheck` scripts:
  - `start`: `vite preview`
  - `typecheck`: `tsc --noEmit`
- Generated a fresh `package-lock.json`.
- Reinstalled dependencies cleanly with npm, including Vite/Rolldown optional native bindings.
- Fixed lint blockers by applying ESLint/Prettier auto-fix for line endings and formatting.

### Verified

- `npm install --no-audit --no-fund --loglevel=warn`
- `npm run typecheck`
- `npm run build`
- `npm run lint`
- `npm run dev -- --host 127.0.0.1 --port 4174`
- Local smoke test: `GET http://127.0.0.1:4174/` returned HTTP 200.

### Notes

- No migration to Next.js was performed.
- No database, Supabase, Firebase, CMS, or auth dependency was introduced.
- Lovable's generated pages, visual structure, and core design were preserved.
- Obvious dormant dependency candidates are documented in `PROJECT_AUDIT.md`, but no dependency cleanup was performed in this pass.
- Remaining non-blocking follow-ups are tracked in `FOUND_ISSUES.md`.
