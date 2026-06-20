# Mobile Typography Checklist

Date: 2026-06-20

## Breakpoints Checked

- 375px: phone baseline for no horizontal page scroll.
- 390px: common compact iPhone width.
- 430px: large phone width, especially Header density.
- 768px: tablet transition.
- 1024px: desktop/tablet layout boundary.
- 1440px: wide desktop reading width.

## Fixes Made

- Global layout now clips accidental document-level horizontal overflow and gives links/buttons visible focus states.
- Header navigation keeps a single compact row on mobile with horizontal overflow inside the nav, not the page.
- Markdown typography now supports Chinese-friendly line height, Unicode heading anchors, h4, hr, task lists, safer external links, image alt fallback, mobile-safe code blocks, and scrollable tables.
- Blog cards, project cards, post metadata, tag filters, and article detail navigation now allow safer wrapping on narrow screens.
- About page contact links now point to GitHub, X, and 小红书.
- Chinese reading time now estimates CJK characters instead of relying only on whitespace-separated words.
- A draft Markdown style test post was added at `src/content/posts/2026-06-20-markdown-style-test.md`.

## Manual Visual Checks Still Recommended

- Confirm the Header feels comfortable on a real 375px device.
- Confirm tag strips remain easy to swipe when many tags exist.
- Check one real Chinese long-form post with code blocks and images.
- Check sharing previews after adding the final `public/images/og-default.png`.

## Markdown Test Notes

The draft test post includes:

- h2 / h3 / h4
- ordered and unordered lists
- task list
- blockquote
- inline code
- fenced code block
- table
- image
- external link
- long URL
- Chinese and English mixed text

It has `draft: true` and `publish: false`, so it should not appear in `/blog` or `sitemap.xml`.
