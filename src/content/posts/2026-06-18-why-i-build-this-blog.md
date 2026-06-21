---
title: "Why I Build This Blog"
description: "A quiet corner for long-form notes, project logs, and the slower thinking that feeds a real personal knowledge system."
date: "2026-06-18"
slug: "why-i-build-this-blog"
tags: ["Blog", "Notes", "Product"]
cover: ""
draft: false
source: "obsidian"
featured: true
project: "MyBlog Engineering Log"
---

I build this blog because I want a place that rewards slow attention. Feeds are good at velocity, but most of the things I care about need revision, context, and a calmer surface.

## Why this matters

Writing in public gives a project a second life. A note starts as private scaffolding, then becomes a small artifact I can return to later.

> A durable blog is less about performance and more about remembering what was true while the work was happening.

## What belongs here

- Project logs that explain tradeoffs
- Notes on AI agents and workflow design
- Materials science reading notes
- Small essays about learning, taste, and tools

## A small publishing rule

Every post should be easy to trace back to a source note, but the website should only depend on committed repository files.

```ts
const runtimeBoundary = "repo content only";
```

That boundary keeps the blog deployable on Vercel while Obsidian stays private and local.
