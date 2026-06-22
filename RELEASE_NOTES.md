# Release Notes

## Version

Pre-launch / v0.1.0

## Highlights

1. Personal blog built with TanStack Start.
2. Markdown content system backed by committed files.
3. Obsidian publishing workflow.
4. Local Publisher Dashboard.
5. Soft and Hard Unpublish workflow.
6. SEO, sitemap, robots, Open Graph, and Twitter Card support.
7. Vercel deployment preparation.
8. Cloudflare custom-domain deployment documentation.

## What Works

- Home page with real latest post data.
- `/blog` article list with search and tag filtering.
- `/blog/{slug}` article detail pages.
- Markdown rendering for headings, lists, blockquotes, code blocks, tables, images, task lists, and long links.
- Article image preview with click-to-open, mouse-wheel zoom, and drag-to-pan.
- `/projects` project-series index derived from post frontmatter.
- `/projects/{slug}` project-series detail pages.
- `/about` page with bilingual English/Chinese copy and contact links.
- `/tags` tag index.
- Build-time `sitemap.xml`, `robots.txt`, and `discovery.json`.
- Obsidian source publishing into `src/content/posts` and `public/images/posts/{slug}`.
- Local Publisher Dashboard for scan, validate, publish, commit, push, and unpublish workflows.
- Unpublish CLI through `npm run unpublish:post`.

## Known Limitations

1. Local Publisher only works on the local machine.
2. Vercel cannot access the Obsidian Vault; it only deploys committed Markdown and images.
3. Deploy Hook is optional and must stay in `.env.local`.
4. Search is local client-side filtering, not a full search engine.
5. Comments and newsletter are not implemented.
6. `public/images/og-default.png` still needs final artwork.
7. Production domain verification must be completed in Vercel and Cloudflare.

## Deployment Notes

1. Push to `main` triggers Vercel production deployment when the GitHub repository is connected.
2. `VITE_SITE_URL` must be configured in Vercel Production.
3. Cloudflare DNS must point to the Vercel-provided target.
4. Cloudflare SSL/TLS should be Full or Full (strict), not Flexible.
5. After changing `VITE_SITE_URL`, redeploy and check `/sitemap.xml`, `/robots.txt`, canonical URLs, and Open Graph URLs.

## Content Workflow

Obsidian -> Local Publisher Dashboard -> committed Markdown/images -> GitHub -> Vercel.

Typical local flow:

```bash
npm run publisher
```

Then select posts in the local Dashboard and publish. Commit + push triggers Vercel redeploy.

## Security Notes

1. Do not commit `.env.local`.
2. Do not expose the Vercel Deploy Hook URL.
3. Do not expose the Local Publisher Dashboard.
4. Do not configure Obsidian local paths in Vercel.
5. If a post leaks a real secret, rotate/revoke the secret before considering Git history cleanup.
