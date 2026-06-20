# Posts Content

Published blog posts live here as Markdown files named `YYYY-MM-DD-slug.md`.
Obsidian source filenames may be looser, such as `2026-06-20-我的 Blog_Notes.md`;
the publisher normalizes them before writing the deployable Markdown copy here.

The source of truth for writing can stay in a private Obsidian vault. Use the root script to publish a local note into this deployable folder:

```bash
npm run publish:obsidian -- "2026-06-20-我的 Blog_Notes.md"
```

Runtime parsing and filtering live in `src/lib/posts.ts`. Routes and components should import post helpers from `src/lib/posts.ts`, not read Markdown files directly.

`posts.ts` is kept only as historical seed data from the Lovable prototype and is not the active content source.
