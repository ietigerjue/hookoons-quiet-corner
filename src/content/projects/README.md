# Projects Content

Project metadata belongs here. Keep project rendering in `src/components/projects/` and project access helpers in `src/lib/projects.ts`.

`/projects` is used as a series index, not a one-off portfolio page. Project cards are generated
from published posts that include a `project` frontmatter field. Each project card links to
`/projects/{slug}`, where matching blog posts are listed.

To attach a post to a project series, add a `project` field to the post frontmatter:

```yaml
project: price-action-daily-review
```

You can also use a readable name:

```yaml
project: Price Action Daily Review
```

The blog normalizes that value into the route slug `/projects/price-action-daily-review`.

If no published posts use a project value, that project card disappears automatically. Optional
display metadata lives in `projects.ts`; it enriches matching projects but does not create empty
cards by itself.
