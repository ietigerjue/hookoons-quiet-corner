# Unpublish Workflow

The unpublish workflow removes a post from the public blog without rewriting Git history. It is available from the Local Publisher Dashboard and from the CLI.

## Soft Unpublish

Soft Unpublish keeps the published Markdown file in the repository, but marks it as hidden:

```yaml
draft: true
publish: false
unpublishedAt: "2026-06-19T00:00:00.000Z"
```

The image folder under `public/images/posts/{slug}/` is left intact.

Use this when you want the current site to stop showing a post but still want the file to remain in the current GitHub tree.

## Hard Unpublish

Hard Unpublish removes the current published copy from the repository tree:

```text
src/content/posts/YYYY-MM-DD-slug.md
public/images/posts/{slug}/
```

It does not delete the Obsidian source note. It does not rewrite Git history. Old commits may still contain the removed content.

## Dashboard Usage

Start the local Dashboard:

```bash
npm run publisher
```

Open:

```text
http://127.0.0.1:4789
```

Select one or more rows, then choose:

- `Soft Unpublish Selected`
- `Hard Unpublish Selected`

Each row also has per-post `Soft Unpublish` and `Hard Unpublish` buttons.

Hard Unpublish requires confirmation:

```text
You are about to delete selected posts from src/content/posts and public/images/posts. Git history will not be rewritten. Continue?
```

and then:

```text
This removes files from the current GitHub tree after push, but does not erase old commit history.
```

## CLI Usage

Soft unpublish, commit locally, do not push:

```bash
npm run unpublish:post -- "2026-06-19-example.md" --mode soft
```

Hard unpublish, commit locally, do not push:

```bash
npm run unpublish:post -- "2026-06-19-example.md" --mode hard
```

Hard unpublish and push:

```bash
npm run unpublish:post -- "2026-06-19-example.md" --mode hard --push
```

`--mode` defaults to `soft`. Without `--push`, the command modifies the published copy, runs `npm run build`, and creates a local commit only.

## Vercel Deployment

After the unpublish commit is pushed, GitHub/Vercel integration redeploys the site. Soft unpublished posts are excluded from `getPublishedPosts()`, tag counts, and blog route lookup. Hard deleted posts are absent from the content folder and return 404.

If you use a Vercel Deploy Hook, keep the hook URL only in `.env.local`.

## Git History

Normal unpublish does not erase old Git commits. That is intentional.

If a post exposed a secret or private credential:

1. rotate or revoke the secret immediately
2. remove the current site copy
3. consider a separate `git-filter-repo` history rewrite
4. coordinate force-push implications manually

This Dashboard never runs `git-filter-repo` and never force-pushes.

## Cache And Search

Vercel will redeploy after push, but caches may take time to clear. If Cloudflare is in front of the site, purge relevant cache entries when needed.

Search engines may keep cached snippets for a while after the post disappears from the site.

## Safety Rules

- Obsidian source files are not deleted.
- Git history is not rewritten.
- `git add .` is not used.
- Build failure stops commit and push.
- Commit failure stops push.
- Hard Unpublish is explicitly confirmed in the Dashboard.
- Unrelated working tree changes are not staged.
- Existing staged files cause commit/push actions to stop.
