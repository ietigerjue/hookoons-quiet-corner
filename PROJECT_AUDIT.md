# PROJECT_AUDIT — Hookoon's Quiet Corner

Audit date: 2026-06-18
Repair update: 2026-06-18

## 1. Summary

This repository is a Lovable-generated personal blog prototype using TanStack Start, React, Vite, TypeScript, Tailwind CSS v4, and shadcn/ui-style components.

It is not a Next.js project. The current codebase is mostly static and frontend-oriented. No Supabase, Firebase, database, auth, or CMS dependency was found during this audit.

The project has now been normalized to npm-only package management. `package-lock.json` is present, Bun lock/config files were removed, and the local checks pass:

- `npm install`
- `npm run typecheck`
- `npm run build`
- `npm run lint`
- `npm run dev` smoke test on `http://127.0.0.1:4174/`

## 2. Current Project Structure

```text
hookoons-quiet-corner/
├── .lovable/
│   └── project.json
├── src/
│   ├── components/
│   │   ├── site/
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── ScrollingBanner.tsx
│   │   │   └── TagBar.tsx
│   │   └── ui/
│   │       └── shadcn/ui generated primitives
│   ├── hooks/
│   │   └── use-mobile.tsx
│   ├── lib/
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── lovable-error-reporting.ts
│   │   ├── posts.ts
│   │   └── utils.ts
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── about.tsx
│   │   ├── index.tsx
│   │   ├── posts.$slug.tsx
│   │   ├── posts.index.tsx
│   │   ├── tags.tsx
│   │   └── write.tsx
│   ├── routeTree.gen.ts
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── AGENTS.md
├── package-lock.json
├── components.json
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 3. Current Technology Stack

| Question | Finding | Evidence |
|---|---|---|
| Vite + React or Next.js? | Vite + React with TanStack Start. Not Next.js. | `package.json` scripts use `vite`; dependencies include `@tanstack/react-start`, `@tanstack/react-router`; `vite.config.ts` imports `@lovable.dev/vite-tanstack-config`. |
| TypeScript? | Yes. | `.tsx/.ts` source files, `tsconfig.json`, TypeScript dependency. |
| Tailwind CSS? | Yes, Tailwind CSS v4. | `tailwindcss`, `@tailwindcss/vite`, `src/styles.css` with `@import "tailwindcss"`. |
| shadcn/ui? | Yes, shadcn-style generated UI set. | `components.json`, `src/components/ui/*`, Radix dependencies, `lucide-react`. |
| Supabase/Firebase/backend? | No database/auth/backend SDK found. | No Supabase/Firebase packages in `package.json`; posts are static in `src/lib/posts.ts`. |
| Lovable integration? | Yes. | `AGENTS.md` Lovable warning, `.lovable/project.json` template `tanstack_start_ts_2026-06-17`. |

## 4. package.json Review

### Scripts

```json
{
  "dev": "vite dev",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "start": "vite preview",
  "preview": "vite preview",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "format": "prettier --write ."
}
```

The script names are now sufficient for a Vite/TanStack Start project. `start` maps to Vite preview, and `typecheck` runs `tsc --noEmit`.

### Dependency Notes

The app imports the core runtime dependencies expected from the template:

- React 19
- TanStack Start / Router / Query
- Vite
- Tailwind v4
- Lucide icons
- Sonner
- shadcn/ui utility stack

Potential cleanup candidates for a later pass:

- Many Radix packages appear to exist because the full shadcn/ui component set was generated, not because every component is used by the blog pages.
- `date-fns`, `zod`, `@hookform/resolvers`, `react-hook-form`, `recharts`, and several UI-specific dependencies may be unused by the current visible pages.
- Do not remove these yet. First run a dependency usage check after the project installs/builds reliably.

### Vercel Deployment Risk

This is not a standard static Vite-only app; it is TanStack Start with an SSR/server entry. Vercel can support TanStack Start, but this repo currently has no `vercel.json` and relies on Lovable's wrapper config.

Important note from `vite.config.ts`: the Lovable config includes Nitro and says the build-only default target is Cloudflare. That may be fine inside Lovable, but it should be verified before assuming a clean Vercel production deployment.

Recommended later action: add an explicit Vercel deployment check once dependencies install cleanly. If needed, add minimal platform-specific config instead of rewriting the app.

## 5. Existing Pages and Components

### Routes

| Route | File | Purpose |
|---|---|---|
| `/` | `src/routes/index.tsx` | Home page with scrolling banner, tag filter, featured post, latest posts. |
| `/posts` | `src/routes/posts.index.tsx` | Searchable and tag-filterable post list. |
| `/posts/$slug` | `src/routes/posts.$slug.tsx` | Post detail page with markdown rendering, TOC, prev/next navigation. |
| `/tags` | `src/routes/tags.tsx` | Tag index and related post list. |
| `/about` | `src/routes/about.tsx` | Author intro, topics, placeholder contact links. |
| `/write` | `src/routes/write.tsx` | Prototype-only local writing UI with live preview and image picker. |

### Site Components

- `src/components/site/Navbar.tsx`
- `src/components/site/Footer.tsx`
- `src/components/site/ArticleCard.tsx`
- `src/components/site/ScrollingBanner.tsx`
- `src/components/site/TagBar.tsx`

### Data Layer

Content is currently stored in `src/lib/posts.ts` as a static `POSTS` array. There is no MDX content folder, CMS adapter, API route, or database-backed publishing flow.

The `/write` page is prototype UI only. Its save/publish buttons show toasts and do not persist content.

## 6. Local Run and Build Verification

### Environment Observed

- Node: `v24.15.0`
- npm: `11.12.1`
- Bun: `1.3.14`

### Install Attempts

| Command | Result |
|---|---|
| `npm install --no-audit --no-fund --loglevel=warn` | Passed after npm cache verification and clean reinstall. |

### Checks

| Command | Result |
|---|---|
| `npm run typecheck` | Passed. |
| `npm run build` | Passed. |
| `npm run lint` | Passed after ESLint/Prettier auto-fix of line endings and formatting. |
| `npm run dev -- --host 127.0.0.1 --port 4174` | Started successfully; smoke test returned HTTP 200 for `/`. |

### Current Verification Conclusion

The project now has a valid npm install/build/dev baseline. The earlier failure was caused by an incomplete dependency installation and a missing optional Rolldown native binding; clearing npm cache, removing the partial install, and reinstalling with optional dependencies restored the Vite/Rolldown binaries.

Relevant local logs:

- `audit-npm-install.log`
- `audit-bun-install.log`
- `audit-build.log`
- `audit-bun-build.log`

## 7. Current Issues

1. Dependency install required a clean reinstall on this machine.
   - Initial install attempts were interrupted or affected by npm optional dependency resolution.
   - Current `package-lock.json` and `node_modules` are healthy.

2. Package-manager ambiguity has been resolved.
   - Project is now npm-only.
   - `bun.lock` and `bunfig.toml` were removed.
   - `packageManager` is set to `npm@11.12.1`.

3. Vercel target needs explicit verification.
   - TanStack Start can run on Vercel, but Lovable config comments mention Nitro defaulting to Cloudflare.
   - No `vercel.json` exists.

4. Markdown rendering is prototype-level.
   - `posts.$slug.tsx` builds HTML manually and injects it via `dangerouslySetInnerHTML`.
   - The current renderer escapes basic HTML characters before wrapping markdown tokens, so immediate risk is limited for trusted static content.
   - If content becomes user-editable or MDX-backed, replace this with a well-tested markdown/MDX pipeline and URL sanitization.

5. `/write` page is not a real publishing backend.
   - It stores state in memory and uses object URLs for image preview.
   - Object URLs are not revoked, which is a small memory leak during long editing sessions.

6. Placeholder links remain.
   - About contact links use `href="#"`.

7. Static `POSTS` array will not scale well.
   - Fine for a prototype.
   - For a real blog, migrate to local MDX/content files or a lightweight content collection.

## 8. Vercel-Oriented Refactor Suggestions

Do not rewrite the whole project at once. Preserve Lovable's generated pages and visual system while making deployment and content flow reliable.

Recommended order:

1. Stabilize package management.
   - Completed: npm is the standard package manager.
   - `package-lock.json` is present.
   - Bun lock/config files were removed.

2. Restore a clean install/build baseline.
   - Completed: `npm install`, `npm run typecheck`, `npm run build`, `npm run lint`, and dev smoke test pass.

3. Add a `typecheck` script.
   - Completed: `"typecheck": "tsc --noEmit"`.

4. Verify TanStack Start deployment target.
   - Try a Vercel preview deployment after local build passes.
   - Add `vercel.json` only if the default detection fails.

5. Replace static post data with content files.
   - Keep existing pages/components.
   - Move post content to `content/posts/*.md` or `*.mdx`.
   - Generate typed post metadata in `src/lib/posts.ts`.

6. Harden markdown rendering.
   - Use a markdown/MDX renderer with rehype/remark plugins.
   - Sanitize links and HTML if content can come from user input.

7. Decide whether `/write` should exist in production.
   - If production writing is Git/MDX-based, hide or remove the nav link later.
   - If keeping it, make it clearly local-only or add real persistence/auth in a separate phase.

8. Fill real profile/contact data.
   - Replace placeholder About links.
   - Add GitHub/Bilibili/RSS links if desired.

## 9. Next Task List

1. Confirm Vercel preview deployment for TanStack Start/Lovable config.
2. Decide production behavior for `/write`.
3. Replace placeholder About/contact links.
4. Plan a small content refactor from static `POSTS` to file-based posts.
5. Replace prototype markdown rendering with a safer content pipeline before accepting untrusted content.
6. Review obviously dormant dependencies after the app has a deployed baseline; do not remove them in the first deploy pass.

## 10. 2026-06-19 Obsidian Publish Workflow Status

- Static TS seed data is no longer the active runtime content source. `src/lib/posts.ts` now loads `src/content/posts/*.md` with `import.meta.glob`.
- Added `/blog` and `/blog/$slug` routes while preserving existing `/posts` routes.
- Added local publisher script: `npm run publish:obsidian -- "YYYY-MM-DD-slug.md"`.
- Added docs: `docs/obsidian-publish-workflow.md`, `README.md`, `.env.example`.
- Added three example published Markdown posts.
- Verified:
  - `npm run publish:obsidian` dry-run with local temp Obsidian-style note, image embeds, cover image, wiki links, and code fence preservation.
  - `npm run typecheck`
  - `npm run build`
  - `npm run lint` exits 0 with the same 6 existing shadcn Fast Refresh warnings.
  - Preview smoke: `/`, `/posts`, `/blog`, `/blog/why-i-build-this-blog` all returned HTTP 200.

Remaining non-blocking items:

1. Real Vercel preview deployment still needs to be confirmed from GitHub.
2. `/write` remains a prototype-only browser draft UI; the production writing path is the Obsidian CLI workflow.
3. Existing shadcn Fast Refresh warnings remain non-blocking.

## 11. Files Inspected

- `AGENTS.md`
- `.lovable/project.json`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `components.json`
- `eslint.config.js`
- `src/router.tsx`
- `src/routeTree.gen.ts`
- `src/start.ts`
- `src/server.ts`
- `src/styles.css`
- `src/lib/posts.ts`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/posts.index.tsx`
- `src/routes/posts.$slug.tsx`
- `src/routes/tags.tsx`
- `src/routes/about.tsx`
- `src/routes/write.tsx`
- `src/components/site/Navbar.tsx`
- `src/components/site/Footer.tsx`
- `src/components/site/ArticleCard.tsx`
- `src/components/site/ScrollingBanner.tsx`
- `src/components/site/TagBar.tsx`
- `src/components/ui/` inventory

No `.env` or secret files were read.
