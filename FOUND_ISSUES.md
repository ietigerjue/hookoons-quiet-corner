# Found Issues

Date: 2026-06-18

These issues are not current local blockers. They are intentionally left for a later, smaller pass.

## 1. Vercel deployment target still needs real preview verification

Local `npm run build` passes, but the Lovable wrapper logs:

```text
[@lovable.dev/vite-tanstack-config] No Lovable context detected — skipping nitro deploy plugin.
```

This is acceptable for local verification, but a real Vercel preview deployment should still be tested before calling production deployment ready.

Suggested next step:

- Import the repository into Vercel.
- Confirm TanStack Start detection/build output.
- Keep `vite.config.ts` on the explicit `nitro: { preset: "vercel" }` setting.
- Add `vercel.json` only if a specific redirect/header requirement appears after preview verification.

Status:

- Partially mitigated locally by enabling the Nitro Vercel preset.
- Still open until a real Vercel Preview or Production deployment is checked.

## 2. ESLint has shadcn Fast Refresh warnings

`npm run lint` exits successfully, but reports six warnings from generated shadcn/ui files:

- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/toggle.tsx`

The warning is `react-refresh/only-export-components`. This is common in generated shadcn files that export component variants or helper constants.

Suggested next step:

- Leave as-is unless hot reload behavior becomes a real development problem.
- If needed, split variant exports into companion files in a later UI-maintenance pass.

## 3. Vite warns that `vite-tsconfig-paths` may be removable

Build/dev logs include:

```text
The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option.
```

The current Lovable wrapper says it provides the path alias setup, and `@/*` imports work. No alias fix is needed now.

Suggested next step:

- Do not change this until after Vercel preview deploy is verified.
- If simplifying later, remove `vite-tsconfig-paths` only together with a focused alias regression test.

## 4. Dormant dependency candidates

Several dependencies appear to be present because Lovable generated the full shadcn/ui component catalog. They may not all be used by visible blog pages.

Examples:

- `date-fns`
- `zod`
- `@hookform/resolvers`
- `react-hook-form`
- `recharts`
- assorted Radix packages for unused generated UI primitives

Suggested next step:

- Do not remove dependencies in this stabilization pass.
- Run a dedicated dependency audit after the first successful deployment baseline.

## 5. Default Open Graph image asset still needs final artwork

SEO metadata now points default sharing previews to `/images/og-default.png`, but the actual PNG asset has not been provided yet. A placeholder instruction file exists at `public/images/README.md`.

Suggested next step:

- Add `public/images/og-default.png` as a 1200x630 social preview image.
- After adding it, run `npm run build` and check one article URL in a social preview debugger.

## 6. Production `VITE_SITE_URL` still needs real domain verification

The SEO and sitemap helpers correctly read `VITE_SITE_URL`, but local builds may generate localhost fallback URLs when that environment variable is missing. Do not hardcode the final production domain in source files.

Suggested next step:

- Set `VITE_SITE_URL=https://your-domain.com` in Vercel Production Environment Variables.
- Redeploy after changing the environment variable.
- Verify `/sitemap.xml`, `/robots.txt`, and page canonical URLs on the deployed site.
- Run a source check such as `rg -n "localhost:3000" public dist` after a production-like build with the real environment variable.
