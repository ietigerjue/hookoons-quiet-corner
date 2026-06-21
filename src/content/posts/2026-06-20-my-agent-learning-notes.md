---
title: "My Agent Learning Notes"
description: "A working note on how I am learning to use coding agents through small loops of review, tests, and memory."
date: "2026-06-20"
slug: "my-agent-learning-notes"
tags: ["Agent", "AI", "Notes"]
cover: ""
draft: false
source: "obsidian"
project: "AI Agent Workflow Lab"
---

The most useful thing I have learned about agents is that they are better inside a loop than inside a wish. A clear task, a tight diff, and a repeatable check do more than a grand prompt.

## The loop

1. Write the smallest useful task.
2. Let the maker implement it.
3. Let the checker review correctness, security, and regressions.
4. Record the result in project memory.

## What I keep watching

- Whether the agent touched files outside the requested scope
- Whether tests prove the important behavior
- Whether docs match the real workflow
- Whether secrets or local-only paths could leak into deployable code

## One pattern that helps

Keep the runtime boundary simple. For this blog, Obsidian is a source system, Markdown files in the repo are the published system, and Vercel only sees committed files.
