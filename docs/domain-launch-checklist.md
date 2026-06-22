# Domain Launch Checklist

Use this after the Vercel project and Cloudflare DNS are configured.

## DNS And TLS

- [ ] Vercel domain is verified.
- [ ] Cloudflare DNS points to the Vercel-provided target.
- [ ] SSL/TLS mode is Full or Full (strict).
- [ ] Flexible SSL is not enabled.
- [ ] Only one canonical direction is configured: apex -> www or www -> apex.

## Environment

- [ ] Vercel Production has `VITE_SITE_URL=https://your-domain.com`.
- [ ] Vercel Preview uses a preview URL or an intentionally documented fallback.
- [ ] Obsidian and Local Publisher variables are not configured in Vercel.
- [ ] Deploy Hook URL is not committed to the repository.

## Site Smoke Test

- [ ] `/`
- [ ] `/blog`
- [ ] `/blog?tag=AI`
- [ ] one published `/blog/{slug}` page
- [ ] `/projects`
- [ ] `/about`
- [ ] `/sitemap.xml`
- [ ] `/robots.txt`
- [ ] `/blog/not-existing-post` returns a friendly 404.

## SEO

- [ ] Page source canonical URLs use the production domain.
- [ ] `og:url` uses the production domain.
- [ ] `og:image` is reachable.
- [ ] `twitter:image` is reachable.
- [ ] sitemap URLs use the production domain.
- [ ] robots `Sitemap:` uses the production domain.
- [ ] Draft and unpublished posts are absent from sitemap.

## Content

- [ ] Published posts are visible on `/blog`.
- [ ] Draft posts are hidden in production.
- [ ] Obsidian images render from `/images/posts/{slug}/`.
- [ ] Markdown tables and code blocks do not cause horizontal page scroll.
- [ ] Article images can be opened, zoomed, and dragged in the preview overlay.

## Cloudflare Cache

- [ ] Purge Cloudflare cache after DNS/canonical changes.
- [ ] Purge specific article URLs after hard unpublish when necessary.
- [ ] Recheck the site in a private browser window.
