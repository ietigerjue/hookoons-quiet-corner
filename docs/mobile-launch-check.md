# Mobile Launch Check

Automated command checks passed, but final mobile polish still needs human visual confirmation on a real browser or device before public launch.

## Breakpoints To Check

- [ ] 375px
- [ ] 390px
- [ ] 430px
- [ ] 768px
- [ ] 1024px
- [ ] 1440px

## Pages

- [ ] `/`
- [ ] `/blog`
- [ ] `/blog?tag=AI`
- [ ] one published `/blog/{slug}` page
- [ ] `/projects`
- [ ] `/about`

## What Was Checked In Code

- Global `html` and `body` disable horizontal overflow.
- Markdown tables and code blocks use local horizontal scrolling.
- Images use `max-width: 100%`.
- Header, cards, tags, and article layouts use responsive padding and constrained widths.
- Motion-heavy UI respects `prefers-reduced-motion`.
- Article images support click preview, mouse-wheel zoom, and drag-to-pan.

## Manual Visual Items

- [ ] 375px has no page-level horizontal scroll.
- [ ] Header does not wrap awkwardly at 390px / 430px.
- [ ] Blog tags remain usable when many tags are present.
- [ ] Article code blocks and tables scroll inside their own containers.
- [ ] Image preview controls are reachable on mobile and desktop.
- [ ] Footer wraps naturally.
- [ ] Focus states are visible when keyboard navigating.

## Status

Manual mobile visual pass is recommended before marking the custom domain launch as complete.
