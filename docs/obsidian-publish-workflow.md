# Obsidian Publish Workflow

This project uses Obsidian as the private writing source and committed Markdown files as the deployable blog source. Vercel only reads files committed to this repository.

## Local Setup

Create a local `.env.local` or shell environment with your private paths. The publish script auto-loads `.env.local` from the repository root. Do not commit real paths or secrets.

```bash
OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault
OBSIDIAN_POSTS_DIR=/path/to/your/obsidian/vault/Blog
VITE_SITE_URL=https://example.com
```

`.env.local` is ignored by `.gitignore`.

Shell environment variables take priority over values in `.env.local`.

## Filename Rule

Post filenames must use:

```text
YYYY-MM-DD-title.md
```

The title part may contain Chinese or English letters, numbers, spaces, underscores, and hyphens. The publisher normalizes it into a blog slug:

- uppercase letters become lowercase
- spaces and underscores become hyphens
- unsupported punctuation is collapsed into hyphens
- Chinese characters are preserved

Example:

```text
2026-06-20-我的 Blog_Notes.md
```

publishes as:

```text
src/content/posts/2026-06-20-我的-blog-notes.md
/blog/我的-blog-notes
```

## Frontmatter

Each Obsidian source note should include:

```yaml
---
title: "我的文章标题"
titleEn: "My Post Title"
description: "A short summary for cards and SEO."
tags: ["Blog", "Notes"]
cover: "cover.png"
draft: false
---
```

Required fields:

- `title`
- `description`
- `tags`

`titleEn` is optional. When present, the blog card, article page, search, and SEO title display both the primary title and the English title.

The publisher derives `date` and a normalized `slug` from the filename. Published files always include `source: "obsidian"` and default `draft` to `false`.

## Images

Supported image extensions:

```text
png, jpg, jpeg, webp, gif, svg
```

The script copies referenced images into:

```text
public/images/posts/{slug}/
```

It rewrites Obsidian image embeds:

```markdown
![[image.png]]
```

into:

```markdown
![image](/images/posts/{slug}/image.png)
```

It also rewrites relative Markdown images:

```markdown
![Alt text](image.png)
```

If `cover` points to a local image, it is copied as `cover.{ext}` and the published frontmatter points to `/images/posts/{slug}/cover.{ext}`.

Missing images fail the publish. Existing generated images may be overwritten with a warning, but directories are not deleted.

## Wiki Links

The publisher converts wiki links outside code fences:

```markdown
[[Some Note]]
[[Some Note|display text]]
```

into plain text:

```text
Some Note
display text
```

Code fences are preserved and are not rewritten.

Article wiki links are converted to blog links when the target looks like a published post filename:

```markdown
[[2026-06-20-my-agent-learning-notes]]
[[2026-06-20-my-agent-learning-notes|My agent notes]]
```

becomes:

```markdown
[2026-06-20-my-agent-learning-notes](/blog/my-agent-learning-notes)
[My agent notes](/blog/my-agent-learning-notes)
```

Non-article wiki links become plain text to avoid exposing private Obsidian note structure.

## Links

External Markdown links are preserved when they start with `http://`, `https://`, or `mailto:`.

Markdown links to published post filenames are converted to blog routes:

```markdown
[Agent notes](2026-06-20-my-agent-learning-notes.md)
[Agent notes](./2026-06-20-my-agent-learning-notes.md)
[Agent notes](../Blog/2026-06-20-my-agent-learning-notes.md)
```

becomes:

```markdown
[Agent notes](/blog/my-agent-learning-notes)
```

Local non-image file links such as `file://`, Windows drive paths, `/Users/`, `~/`, or `attachments/` paths are not preserved as online links. The publisher prints a warning and keeps only the visible link text. Images still use the image-copy rules above.

## Publish Without Deploy

Publish a file by filename:

```bash
npm run publish:obsidian -- "2026-06-18-why-i-build-this-blog.md"
```

Publish an absolute file path:

```bash
npm run publish:obsidian -- "/path/to/vault/Blog/2026-06-18-why-i-build-this-blog.md"
```

The script validates the post, copies images, writes `src/content/posts/YYYY-MM-DD-slug.md`, then runs `npm run build`.

## Publish And Deploy

Use `--deploy` only when you want the script to commit and push:

```bash
npm run publish:obsidian -- "2026-06-18-why-i-build-this-blog.md" --deploy
```

The script builds first. If the build passes, it stages only the generated article and copied images, commits with `publish: YYYY-MM-DD-slug`, and pushes the current branch. GitHub then triggers Vercel deployment.

It refuses to deploy when there are unresolved conflicts or already staged files.

## Common Errors

- `OBSIDIAN_POSTS_DIR is required`: set `OBSIDIAN_POSTS_DIR` when publishing by filename.
- `Post filename must be YYYY-MM-DD-title.md`: keep the `YYYY-MM-DD-` prefix and give the title part at least one letter or number after normalization.
- `Frontmatter field "title" is required`: add the missing field.
- `Referenced image not found`: move the image next to the note, under the vault root, or under `attachments` / `Attachments`.
- `build exited with status`: fix the reported build error before committing.
