# Found Issues

Task: Launch precheck / Task 11
Date: 2026-06-22

No blocking code/build issues found.

## Issue 1

- Title: Default Open Graph image asset is missing
- Severity: Medium
- Area: SEO
- Impact: Pages emit complete Open Graph metadata, but `og:image` and `twitter:image` may resolve to a missing `/images/og-default.png` asset when a post does not define `cover`.
- Evidence: `src/lib/seo.ts` uses `/images/og-default.png`; `public/images/README.md` documents the missing file; `public/images/og-default.png` does not exist.
- Recommended Fix: Add a 1200x630 `public/images/og-default.png`, then run `npm run build` and test one URL in a social preview debugger.
- Fixed: No
- Notes: Not a build blocker, but should be fixed before public sharing.

## Issue 2

- Title: Production domain and `VITE_SITE_URL` still need real deployment verification
- Severity: Medium
- Area: Deployment / SEO
- Impact: Local builds without `VITE_SITE_URL` fall back to `http://localhost:3000` for sitemap, robots, discovery, and SEO URLs. Production should generate the real domain.
- Evidence: `scripts/generate-sitemap.mjs` and `src/lib/seo.ts` intentionally fall back to localhost; current local `public/sitemap.xml`, `public/robots.txt`, and `public/discovery.json` are generated from that fallback when no environment variable is set.
- Recommended Fix: Set `VITE_SITE_URL=https://your-domain.com` in Vercel Production, redeploy, then verify `/sitemap.xml`, `/robots.txt`, canonical URLs, `og:url`, and `twitter:image`.
- Fixed: No
- Notes: This is expected local behavior and not a source-code blocker.

## Issue 3

- Title: Final Cloudflare/Vercel custom-domain verification is pending
- Severity: Medium
- Area: Deployment
- Impact: The repository contains deployment guidance, but the real Vercel domain state, Cloudflare DNS records, TLS mode, and canonical redirect behavior require dashboard verification.
- Evidence: No live production domain was provided to this task. `docs/deployment-cloudflare-vercel.md` and `docs/domain-launch-checklist.md` now document the required checks.
- Recommended Fix: Complete the domain checklist after adding the real domain to Vercel and Cloudflare.
- Fixed: No
- Notes: Cannot be fully automated from the local repository.

## Issue 4

- Title: ESLint reports generated shadcn/ui Fast Refresh warnings
- Severity: Low
- Area: Code
- Impact: `npm run lint` exits successfully, but six generated shadcn/ui files warn about exporting non-component helpers from component files.
- Evidence: `src/components/ui/badge.tsx`, `button.tsx`, `form.tsx`, `navigation-menu.tsx`, `sidebar.tsx`, and `toggle.tsx`.
- Recommended Fix: Leave as-is unless Fast Refresh behavior becomes a development problem; split variant/helper exports in a later UI-maintenance pass if needed.
- Fixed: No
- Notes: Non-blocking.

## Issue 5

- Title: Mobile layout needs final human visual pass
- Severity: Low
- Area: Mobile
- Impact: Code-level responsive checks and build checks passed, but exact breakpoints and touch feel need browser/device inspection.
- Evidence: No automated visual regression tool is configured in this repository.
- Recommended Fix: Use `docs/mobile-launch-check.md` to manually inspect 375px, 390px, 430px, 768px, 1024px, and 1440px.
- Fixed: No
- Notes: Non-blocking for preview, recommended before final public announcement.
