---
title: "Markdown 排版测试"
titleEn: "Markdown Style Test"
description: "用于本地检查中文阅读体验、代码块、表格、图片和长链接的草稿文章。"
date: "2026-06-20"
slug: "markdown-style-test"
tags: ["Test"]
draft: true
publish: false
source: "seed"
---

这是一篇只用于本地排版检查的草稿文章。它不会出现在正式博客列表，也不会进入 sitemap。正文包含中文、English terms、inline `code`、长链接和常见 Markdown 元素，用来确认移动端阅读不会出现横向滚动。

## 二级标题：中文长文与 English Mixed Content

中文段落需要有稳定的行高和阅读宽度。When AI agents, local publishing workflows, and Obsidian notes appear in one paragraph, the typography should still feel calm, clear, and easy to scan.

这是一个很长的链接，用来测试自动换行：[https://example.com/research/very/long/path/that/should/not/create-horizontal-scroll-on-mobile?query=agentic-workflow-and-markdown-rendering](https://example.com/research/very/long/path/that/should/not-create-horizontal-scroll-on-mobile?query=agentic-workflow-and-markdown-rendering)

### 三级标题：列表、引用与任务项

无序列表：

- 移动端左右边距需要自然。
- 标签和按钮不能把卡片撑破。
- 表格与代码块应该在自身区域内滚动。

有序列表：

1. 打开文章详情页。
2. 切换到 375px 宽度。
3. 检查页面是否出现横向滚动。

- [x] 已检查标题层级。
- [ ] 待人工确认真实手机手感。

> 引用块应该轻一点，适合中文阅读，不要比正文更抢眼。

#### 四级标题：代码块

```ts
const longLine =
  "This deliberately long line should stay inside the code block and scroll horizontally instead of forcing the whole document to overflow on a narrow mobile viewport.";

export function estimateReadingTime(text: string) {
  return Math.max(1, Math.ceil(text.length / 450));
}
```

## 表格

| 场景   | 期望              | 移动端表现           |
| ------ | ----------------- | -------------------- |
| 代码块 | 内容横向滚动      | 页面本身不横向滚动   |
| 表格   | 容器内横向滚动    | 单元格边框轻，不拥挤 |
| 图片   | `max-width: 100%` | 不撑破正文           |

## 图片

![Markdown 排版测试图](/images/markdown-style-test.svg)

---

结尾段落用于确认正文末尾间距。Strong text like **重点信息** and emphasized text like _soft emphasis_ should remain readable in a Chinese paragraph.
