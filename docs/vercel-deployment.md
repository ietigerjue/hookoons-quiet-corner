# Vercel Deployment Guide

## 1. Project Type

This project is a TanStack Start + React + Vite + TypeScript personal blog. It is not a Next.js project.

The app keeps the Lovable TanStack Vite wrapper and explicitly enables Nitro with the Vercel preset in `vite.config.ts`.

## 2. What Vercel Deploys

Vercel deploys:

- Published Markdown files in `src/content/posts`.
- Synced public images in `public/images/posts`, plus other checked-in public assets.
- The public blog pages, including `/`, `/blog`, `/blog/$slug`, `/projects`, and `/about`.
- Build-time `sitemap.xml`, `robots.txt`, and discovery metadata.
- Route-level SEO metadata, canonical URLs, Open Graph, and Twitter Card tags.

Vercel does not read:

- Your local Obsidian Vault.
- Your local Obsidian Blog folder.
- The Local Publisher Dashboard server.
- `.env.local`.

The deployed site reads already-published copies from the repository only.

## 3. Required Environment Variables

Set this in Vercel Production:

```env
VITE_SITE_URL=https://your-domain.com
```

`VITE_SITE_URL` is used for canonical URLs, Open Graph URLs, `sitemap.xml`, `robots.txt`, and discovery metadata.

For Vercel Preview, set either:

```env
VITE_SITE_URL=https://your-preview-domain.vercel.app
```

or leave it unset for temporary checks. If unset, sitemap generation falls back to `http://localhost:3000`, so production should always define it.

## 4. Local-only Environment Variables

These are for local publishing only. Do not configure them in Vercel:

```env
OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault
OBSIDIAN_POSTS_DIR=/path/to/your/obsidian/vault/Blog
LOCAL_PUBLISHER_PORT=4789
LOCAL_PUBLISHER_HOST=127.0.0.1
LOCAL_PUBLISHER_TOKEN=change-this-local-token
VERCEL_DEPLOY_HOOK_URL=
```

`VERCEL_DEPLOY_HOOK_URL` is a secret-like URL. Keep it in `.env.local` only if you use deploy hooks from the local Dashboard. Never commit it.

## 5. Vercel Project Settings

Recommended settings:

- Framework Preset: let Vercel auto-detect first. If manual selection is needed, use Other or Vite, not Next.js.
- Install Command: default.
- Build Command: `npm run build`.
- Output Directory: leave empty/default. Nitro's Vercel preset produces the deployment output.
- Production Branch: `main`.
- Environment Variables: set `VITE_SITE_URL` for Production.

No `vercel.json` is required for the current app. Add one later only for a specific need such as verified headers or redirects.

## 6. First Deployment

1. Run local checks:

```bash
npm run typecheck
npm run lint
npm run build
```

2. Push the repository to GitHub:

```bash
git push
```

3. Open Vercel and choose Import Git Repository.
4. Select the GitHub repository.
5. Confirm the project settings:
   - Build Command: `npm run build`
   - Output Directory: default/empty
   - Production Branch: `main`
6. Add `VITE_SITE_URL=https://your-domain.com`.
7. Deploy.
8. After deployment, check:
   - `/`
   - `/blog`
   - one `/blog/$slug` article page
   - `/projects`
   - `/about`
   - `/sitemap.xml`
   - `/robots.txt`
   - page canonical and Open Graph metadata

## 7. Update Content After Deployment

The normal update loop is:

1. Write in Obsidian locally.
2. Run the local Dashboard:

```bash
npm run publisher
```

3. Select posts.
4. Publish.
5. Let the local workflow run build, commit, and push.
6. GitHub push triggers Vercel redeploy.

The Vercel deployment never depends on the Obsidian source folder. It only deploys committed Markdown and images.

## 8. Preview Deployment

- `main` should map to Production.
- Feature branches and pull requests can map to Preview deployments.
- Daily article publishing can go directly through `main`.
- A more conservative flow can use a content branch and pull request.

Use Preview deployments to check:

- Mobile layout.
- Markdown rendering.
- Article images.
- Open Graph metadata.
- `sitemap.xml`.
- `robots.txt`.

Before binding a custom domain, the `vercel.app` domain is enough for deployment smoke testing.

## 9. Troubleshooting

### Build failed

Run the same command locally:

```bash
npm run build
```

Check whether the failure is TypeScript, route generation, Markdown frontmatter, or Nitro output.

### Missing VITE_SITE_URL

Local builds can fall back to `http://localhost:3000`, but Production should define:

```env
VITE_SITE_URL=https://your-domain.com
```

Redeploy after changing the variable.

### sitemap URL wrong

Check Vercel Environment Variables and redeploy. Then open `/sitemap.xml` and confirm URLs use the production domain.

### robots missing

`npm run build` runs `prebuild`, which runs `npm run generate:sitemap`. That writes `public/robots.txt`. If it is missing, run:

```bash
npm run generate:sitemap
```

### page 404

Check `src/routes` and `src/routeTree.gen.ts`. If routes were added or renamed, rerun build so TanStack Router regenerates the route tree.

### Nitro config issue

This project uses the Lovable wrapper with:

```ts
nitro: {
  preset: "vercel",
}
```

Do not add a second manual `nitro()` plugin unless the wrapper is removed.

### route generation issue

Run:

```bash
npm run build
```

Then inspect `src/routeTree.gen.ts` if route types do not match the files under `src/routes`.

### Tailwind style missing

Confirm `@tailwindcss/vite` is still installed and that `src/styles.css` is imported from the root route.

### Obsidian path error

Obsidian paths are local-only. They are required for `npm run publisher` and `npm run publish:obsidian`, not for Vercel.

### Publisher accidentally exposed

The Publisher Dashboard is served only by `scripts/local-publisher-server.mjs`, bound to `127.0.0.1`, and started only through `npm run publisher`. It is not imported by `src/routes`.

### Deploy succeeded but article not updated

Confirm the article exists in `src/content/posts`, is committed, and is not `draft: true` or `publish: false`.

### GitHub push did not trigger Vercel deployment

Check that the Vercel project is connected to the correct GitHub repository and that Production Branch is `main`.
