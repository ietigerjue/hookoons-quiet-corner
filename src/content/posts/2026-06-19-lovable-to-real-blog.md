---
title: "From Lovable Prototype to Real Blog"
description: "Notes on turning a generated Lovable prototype into a maintainable TanStack Start blog without losing its visual character."
date: "2026-06-19"
slug: "lovable-to-real-blog"
tags: ["Blog", "Coding", "Product"]
cover: ""
draft: false
source: "obsidian"
---

The first version of this site came from Lovable. That was useful because it gave the blog a mood quickly: quiet typography, simple cards, and a homepage that already felt personal.

## The refactor line

The goal is not to replace the prototype. The goal is to make it easier to keep.

| Layer   | Current direction          | Reason                                 |
| ------- | -------------------------- | -------------------------------------- |
| Routes  | TanStack Start file routes | Keeps the Lovable app structure intact |
| Styling | Tailwind CSS v4            | Preserves the existing visual language |
| Content | Markdown files             | Fits the Obsidian writing workflow     |

## What changed

The prototype became a small set of stable pieces: layout components, blog cards, project cards, post utilities, and a Markdown renderer.

This keeps future changes boring in the best possible way. New posts go into content, new pages go into routes, and the design system stays recognizable.
