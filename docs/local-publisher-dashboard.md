# Local Publisher Dashboard

The Local Publisher Dashboard is a private browser tool for publishing Obsidian Blog notes into this TanStack Start blog. It scans your local Obsidian Blog folder, validates selected posts, publishes Markdown/images into the repository, runs the production build, and can optionally commit and push so Vercel deploys from GitHub.

The visible Dashboard UI is Chinese. API field names stay English so existing scripts and integrations do not break.

## Local Only

This tool is not part of the deployed blog. It runs from `scripts/local-publisher-server.mjs` and must bind to `127.0.0.1`.

Reasons:

- It reads your private Obsidian vault path.
- It can write files into the repository.
- It can run `npm run build`.
- It can run Git commit and push.
- It may optionally call a Vercel Deploy Hook.

Never expose it on a public interface or commit local secrets.

## Configuration

Create `.env.local` in the repository root:

```env
OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault
OBSIDIAN_POSTS_DIR=/path/to/your/obsidian/vault/Blog
LOCAL_PUBLISHER_PORT=4789
LOCAL_PUBLISHER_HOST=127.0.0.1
LOCAL_PUBLISHER_TOKEN=change-this-local-token
VERCEL_DEPLOY_HOOK_URL=
```

`.env.local` is ignored by `.gitignore`. Do not commit real local paths, tokens, or deploy hook URLs.

`OBSIDIAN_POSTS_DIR` is the folder the Dashboard scans for `*.md` files. `LOCAL_PUBLISHER_TOKEN` protects every `/api/*` request.

## Start The Dashboard

```bash
npm run publisher
```

Then open:

```text
http://127.0.0.1:4789
```

To open the browser automatically:

```bash
npm run publisher:open
```

## Scanning Posts

The Dashboard watches `OBSIDIAN_POSTS_DIR` with `chokidar` and scans Markdown files. It ignores Obsidian/system folders such as `.obsidian`, `.trash`, hidden files, and temporary files.

Each post row includes:

- title and optional English title (`titleEn`)
- filename
- date
- slug
- tags
- status
- last modified time
- errors and warnings

Statuses:

- `invalid`: filename or frontmatter is invalid
- `draft`: `draft: true`
- `not_publishable`: `publish` is not `true`
- `new`: no matching published Markdown file exists yet
- `changed`: source is newer/different than the published output
- `published`: generated content matches the published file
- `unpublished`: published copy exists but is marked `draft: true`
- `orphaned_published`: published copy exists but matching Obsidian source is missing
- `missing_assets`: referenced images are missing
- `error`: other scan error

## Selecting Posts

Use the checkboxes in the left column. Filters and search are local UI helpers; they do not change the source files.

The search box matches title, filename, slug, and tags.

## Validate Selected

`Validate Selected` checks selected posts without writing files.

It validates:

- filename format: `YYYY-MM-DD-title.md`
- required frontmatter: `title`, `description`, `tags`
- optional bilingual title: `titleEn`
- `draft` and `publish` booleans
- image references
- wiki links and local file links

## Dry Run Selected

`Dry Run Selected` runs the shared publish conversion in dry-run mode. It returns the files that would be generated, but it does not write Markdown/images, run Git, or push.

## Publish Selected

`Publish Selected` writes selected posts into:

```text
src/content/posts/
public/images/posts/{slug}/
```

Then it runs:

```bash
npm run build
```

It does not commit or push.

## Publish + Commit + Push

`Publish + Commit + Push` asks for confirmation first:

```text
You are about to publish N posts, commit, and push to remote. Continue?
```

If confirmed, it:

1. validates selected posts
2. publishes all selected posts
3. runs one build
4. stages only generated Markdown and image files
5. commits with `publish: batch posts YYYY-MM-DD` unless a custom message is provided by the API
6. pushes the current branch

Build failure stops commit and push. Commit failure stops push. The script never uses `git add .`.

If your working tree has unrelated changes, they are left untouched. If files are already staged, the publish refuses to commit because Git would otherwise include unrelated staged work.

## Unpublish Posts

The Dashboard supports two removal modes:

- `Soft Unpublish`: keeps `src/content/posts/YYYY-MM-DD-slug.md`, but marks it `draft: true`, `publish: false`, and adds `unpublishedAt`.
- `Hard Unpublish`: removes `src/content/posts/YYYY-MM-DD-slug.md` and `public/images/posts/{slug}/` from the current repository tree.

Hard Unpublish does not rewrite Git history and does not delete the Obsidian source note.

See `docs/unpublish-workflow.md` for the full workflow and CLI commands.

## Vercel Deployment

Normal deployment happens through GitHub/Vercel integration after `git push`.

`POST /api/deploy-hook` can optionally trigger `VERCEL_DEPLOY_HOOK_URL` when configured. The Dashboard does not print the full hook URL in logs.

## API Summary

All `/api/*` routes require `LOCAL_PUBLISHER_TOKEN`.

- `GET /api/posts`
- `GET /api/status`
- `POST /api/refresh`
- `POST /api/validate`
- `POST /api/publish`
- `GET /api/logs`
- `POST /api/deploy-hook`

`GET /api/posts` supports:

- `status`
- `tag`
- `search`

## Common Errors

### OBSIDIAN_POSTS_DIR does not exist

Check `.env.local` and confirm the folder exists locally.

### Filename does not match

Rename the note to:

```text
YYYY-MM-DD-title.md
```

The title part may use Chinese or English letters, numbers, spaces, underscores, and hyphens. The publisher normalizes it into a URL slug before writing the published copy.

### Frontmatter missing

Add:

```yaml
---
title: "Title"
titleEn: "Optional English Title"
description: "Short summary."
tags: ["Blog"]
publish: true
draft: false
---
```

### Images not found

Place the image next to the note, under the vault root, or in `attachments` / `Attachments`.

### Build failed

Fix the build error shown in the log panel. Commit and push are skipped when build fails.

### Git commit failed

Check whether files are already staged or Git user identity is missing.

### Git push failed

Check remote configuration, branch permissions, and network access.

### Vercel did not deploy

Confirm the GitHub repository is connected to Vercel and that the pushed branch is configured for deployment. If using Deploy Hooks, confirm `VERCEL_DEPLOY_HOOK_URL` is configured locally.
