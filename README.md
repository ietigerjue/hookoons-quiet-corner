# Hookoon's Blog

TanStack Start + React + Vite + TypeScript personal blog generated from a Lovable prototype and organized for long-term writing.

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Writing Workflow

Published posts live in `src/content/posts/*.md`. Local Obsidian notes can be copied into the blog with:

```bash
npm run publish:obsidian -- "2026-06-20-我的 Blog_Notes.md"
```

See `docs/obsidian-publish-workflow.md` for naming rules, frontmatter, image handling, and optional GitHub/Vercel deployment.

For a local browser dashboard that scans your Obsidian Blog folder and batch publishes posts, see `docs/local-publisher-dashboard.md`.

For removing published posts without rewriting Git history, see `docs/unpublish-workflow.md`.

## SEO and Site URL

`VITE_SITE_URL` is used to generate canonical URLs, `sitemap.xml`, `robots.txt`, and Open Graph/Twitter sharing URLs.

Local development can omit it; the app falls back to `http://localhost:3000` and prints a clear warning during sitemap generation. Vercel Production should set:

```env
VITE_SITE_URL=https://your-domain.com
```

Configure it in Vercel Environment Variables, then redeploy after changes. After deployment, check:

```text
/sitemap.xml
/robots.txt
```

The example value in `.env.example` is intentionally not a real production domain.
