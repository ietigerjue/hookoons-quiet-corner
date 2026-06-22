# Cloudflare + Vercel Domain Deployment

This project is deployed by Vercel. Cloudflare, if used, should only manage DNS and optional caching/security settings around the Vercel deployment.

## 1. Vercel Domains

1. Open the Vercel project.
2. Go to Settings -> Domains.
3. Add the chosen apex domain, for example `example.com`.
4. Add `www.example.com` only if you want a www hostname.
5. Choose one canonical hostname:
   - apex canonical: `example.com`
   - www canonical: `www.example.com`

Keep `VITE_SITE_URL` aligned with that canonical hostname.

## 2. Cloudflare DNS

Recommended DNS shape:

| Host | Type | Target | Notes |
|---|---|---|---|
| `example.com` | A / CNAME as instructed by Vercel | Vercel-provided target | Use Vercel's exact values |
| `www` | CNAME | Vercel-provided target | Optional if using www |

Start with DNS only if Vercel asks for verification and Cloudflare proxying causes validation issues. After Vercel verifies the domain, you may switch records to Proxied if the site behaves correctly.

## 3. SSL/TLS

Use:

- Full
- Full (strict), after Vercel certificate issuance is complete

Do not use Flexible. Flexible can create redirect loops and mixed-origin HTTPS behavior with Vercel.

## 4. Redirect Strategy

Pick one canonical direction:

- `www.example.com` -> `example.com`
- `example.com` -> `www.example.com`

Do not configure both directions. Prefer handling the canonical domain in Vercel first. Add Cloudflare rules only when the Vercel domain setup has been verified.

## 5. VITE_SITE_URL

Set this in Vercel Production:

```env
VITE_SITE_URL=https://example.com
```

Use the real canonical domain, not a local address. After changing this variable, redeploy the project so canonical URLs, Open Graph URLs, `sitemap.xml`, `robots.txt`, and discovery metadata are regenerated.

## 6. Post-Deploy Checks

After DNS and deployment settle, check:

- `/`
- `/blog`
- one `/blog/{slug}` page
- `/projects`
- `/about`
- `/sitemap.xml`
- `/robots.txt`

Also inspect page source for:

- canonical URL
- `og:url`
- `og:image`
- `twitter:image`

All of them should use the canonical production domain configured in `VITE_SITE_URL`.

## 7. Local Publisher Boundary

The Local Publisher Dashboard is not deployed to Vercel and must not be exposed through Cloudflare. It is started manually with:

```bash
npm run publisher
```

It binds to `127.0.0.1` and reads local-only variables such as `OBSIDIAN_POSTS_DIR` and `LOCAL_PUBLISHER_TOKEN`. Do not configure these variables in Vercel or Cloudflare.

## 8. Cache Notes

If Cloudflare proxying is enabled:

- purge cache after hard unpublishing sensitive content
- check that HTML pages are not cached longer than intended
- remember that search engines may keep cached snippets after a post is removed

## 9. Common Issues

### Vercel cannot verify the domain

Switch the relevant Cloudflare DNS records to DNS only, wait for verification, then enable proxying later if desired.

### Redirect loop

Check that Cloudflare SSL/TLS is not set to Flexible. Use Full or Full (strict).

### sitemap or canonical points to localhost

Set `VITE_SITE_URL` in Vercel Production and redeploy.

### Open Graph image missing

Add `public/images/og-default.png` or set a valid post `cover`, then redeploy and retest a social preview debugger.

### Publisher is reachable publicly

Stop immediately and remove any route/proxy exposing it. The publisher is local-only and should never be behind Cloudflare.
