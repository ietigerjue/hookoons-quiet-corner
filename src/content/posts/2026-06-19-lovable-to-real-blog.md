---
title: "从 Lovable 原型到真实博客：一个本地 Publisher + Obsidian 部署工作流的诞生"
titleEn: "From Lovable Prototype to Real Blog"
description: "详细记录如何把一个 AI 生成的 Lovable 原型，改造成一个可长期维护的 TanStack Start 博客。亮点是自建的本地 Publisher Dashboard + Obsidian 写作发布系统。"
date: "2026-06-19"
slug: "lovable-to-real-blog"
tags: ["Blog", "Coding", "Product", "Obsidian", "Workflow"]
cover: ""
draft: false
source: "obsidian"
project: "MyBlog Engineering Log"
---

这个博客的第一行代码不是手写的，是 Lovable 生成的。

2026 年 6 月 18 日，我在 Lovable 里描述了一个安静的、暖白色调的、带卡片阵列的博客，AI 给了我一个完整的原型：首页有 marquee hero、文章卡片排列整齐、About 页面安静地点着头像和简介。那一刻的感觉是"对了"——视觉语言对了。

但原型和能长期维护的工程之间，有一条需要亲自走过的线。这篇文章记录这条线上每一段路，重点讲我自认为做得最漂亮的部分：**本地 Publisher Dashboard + Obsidian 写作发布机制**。

## 一、原型之后的第一步：工程化

Lovable 给的原型有这些好东西：

- **TanStack Start** 作为框架（文件路由，SSR，TypeScript 原生）
- **Tailwind CSS v4** + shadcn/ui 风格的组件
- 完整的首页、Blog 列表、文章详情、Projects、About 页面

但也有这些问题：

- 混用了 Bun 和 npm，依赖安装到一半就挂
- 组件全放在一个扁平的 `components/site/` 目录里，没有任何分层
- 文章数据是硬编码在 `posts.ts` 里的静态数组

第一天晚上我做了三件事：

1. **统一工具链**：删掉 `bun.lock` 和 `bunfig.toml`，全部走 npm。顺手补了 `typecheck` 和 `lint` 脚本。工程化的第一天原则：build 必须能跑，类型必须能过。

2. **组件分层**：把 `components/site/` 拆成 `layout/`（Header/Footer/SiteShell）、`home/`（HeroSection/MarqueeBanner/LatestPosts）、`blog/`（PostCard/PostMeta/TagPill/MarkdownRenderer）、`projects/`（ProjectCard）。一眼就能看出每个文件的归属。

3. **内容文件化**：把静态数组改成 `src/content/posts/*.md` + `import.meta.glob`。这一步是关键转折——文章变成文件，文件就可以被 Obsidian 管理，Obsidian 管理就可以做发布工作流。

经过这一轮，项目从"能看"变成了"能改"。

## 二、核心亮点：Obsidian → Publisher → Git → Vercel

这是整个博客最让我得意的地方。

### 2.1 为什么要自己做 Publisher？

我的写作环境是 Obsidian。文章写在 Obsidian 里，有 frontmatter、有 `![[图片]]` 引用、有 `[[wiki link]]` 连接到其他笔记。如果每次发文章都要手动复制 Markdown、手动找图片、手动改链接、手动 commit，这个过程会消磨掉所有写作的成就感。

市面上当然有成熟的方案——Notion + API、Headless CMS、甚至直接把 Obsidian Vault 发布。但我不想引入外部服务，也不想把我的 Obsidian 文件夹整个暴露到公网。

我想要的是：**打开一个本地网页，勾选想发的文章，点一个按钮，就发布到线上。**

所以我自己做了一个。

### 2.2 Publisher Dashboard 能做什么

`npm run publisher` 启动后，浏览器打开 `http://127.0.0.1:4789`，你会看到一个中文界面：

**左侧是文章列表**，每篇文章显示文件名、标题、日期、标签和状态：

- 🟢 **New** — Obsidian 里有，博客里还没有
- 🟡 **Changed** — Obsidian 里改了，博客里的旧版本需要更新
- ⚪ **Published** — 两边一致，没有新变化
- 🔴 **Draft / Invalid** — 草稿或有问题，不会发布

**右侧是操作面板**，可以：

- **Validate Selected** — 检查勾选文章的 frontmatter 是否完整、图片是否能找到、链接是否合法
- **Dry Run Selected** — 模拟发布，看转换后的 Markdown 长什么样，但不动任何文件
- **Publish Selected** — 正式发布：把文章 Markdown 转换成博客格式、复制图片到 `public/images/posts/`、所有 Obsidian 语法转成标准 Markdown
- **Publish + Commit + Push** — 发布完直接 `git commit` 并 `push` 到 GitHub。GitHub 推了，Vercel 就自动部署。

**右上角还有一个访问令牌输入框**，所有写操作都要求 `LOCAL_PUBLISHER_TOKEN` 才能执行。这个 token 存在 `.env.local` 里，不会被提交到 Git。

### 2.3 Obsidian → Markdown 的转换细节

这一步是最多坑的。Publisher 的核心转换逻辑在 `scripts/lib/obsidian-publisher.mjs` 里，它做了这些事：

1. **Wiki Links**：`[[2026-06-18-why-i-build-this-blog]]` → `[Why I Build This Blog](/blog/why-i-build-this-blog)`。如果是 `[[SomeNote|显示文字]]`，就用显示文字做链接文本。如果链接的目标文章不存在，就转成纯文本，不让死链接进入发布内容。

2. **图片**：`![[Pasted image 20260621150241.png]]` → `![Pasted image]( /images/posts/lovable-to-real-blog/Pasted-image-20260621150241.png )`。图片会从 Obsidian 的附件目录（或同级 `图片` 文件夹）复制到 `public/images/posts/{slug}/` 下。这一步要处理很多边界情况——中文文件名、空格、不同来源目录。

3. **外链和代码块保护**：`http://` / `https://` / `mailto:` 链接原样保留。fenced code block 里的内容不处理，防止把注释里的 `[[]]` 当成链接转换。

4. **文件名规范化**：Obsidian 源的 `2026-06-19-从 Lovable 原型到真实博客.md` → 发布副本 `2026-06-19-lovable-to-real-blog.md`。中文、空格、下划线都能正确转成 URL-friendly slug。

5. **安全底线**：`file://` 开头的本地路径不会出现在发布后的 Markdown 里。`C:\` 和 `/Users/` 绝对路径会被拦截。build 失败时不会 commit，不会 push。Git 操作只 add 本次生成的文件，从不用 `git add .`。

### 2.4 撤稿也一样简单

如果发出去的文章想撤回，Dashboard 上有两个选择：

- **Soft Unpublish**：给文章 frontmatter 加上 `draft: true`、`publish: false`、`unpublishedAt: ISO时间`。文章还在仓库里，但在博客上看不到了。
- **Hard Unpublish**：删除博客里的文章文件和图片目录。但**不会删 Obsidian 源文件**——你的原始笔记永远安全。

两种方式都不会 force push，不会重写 Git 历史。就是一次普通的 commit。

### 2.5 为什么这套流程好

写文章最好的状态是什么都不用想。打开 Obsidian，打字，存盘。然后在 Publisher 里点一下发布——图片自动跟过去，链接自动转好，commit message 记录清楚是哪篇文章更新了。

整个过程不需要：
- 手动复制粘贴 Markdown
- 手动找图片路径
- 手动改 Wiki Link
- 记 git 命令
- 登录任何管理后台

只有一个本地网页，一个按钮，一个 token。

## 三、其他值得一提的设计

### 3.1 SEO 和 Open Graph

每篇文章自动生成：
- `title`、`description`、`canonical` URL
- `og:title`、`og:description`、`og:image`（优先用文章 cover，没有就用默认 OG 图）
- `twitter:card`（summary_large_image）
- `article:published_time`、`article:tag`

`/sitemap.xml` 和 `/robots.txt` 在每次 build 时自动生成。草稿和被撤下的文章不会出现在 sitemap 里。

### 3.2 Markdown 渲染

支持 h2-h4、有序/无序列表、blockquote、inline code、fenced code block、table、task list、图片点击放大预览（支持滚轮缩放和拖拽平移）。所有元素在 375px 移动端测试过——代码块内部横向滚动，表格不撑破页面，图片 `max-width: 100%`。

### 3.3 中英双语

博客面向中英文读者，所以每条路线都支持双语：
- `/blog` 和 `/about` 的描述：英文在上，中文在下
- 文章标题：`title` 是中文时，可以用 `titleEn` 补充英文副标题
- 标签：中英文标签混用，搜索支持两种语言

### 3.4 Projects 系列页

`/projects` 是一个动态的系列入口。文章 frontmatter 里写 `project: "MyBlog Engineering Log"` 就会自动归入这个系列。有文章就显示卡片，没文章就自动消失——不需要手动维护项目列表。

## 四、技术栈一览

| 层 | 选型 | 为什么 |
|---|---|---|
| 框架 | TanStack Start + Vite + React 19 | Lovable 给的，文件路由 + SSR + TypeScript 原生支持 |
| 样式 | Tailwind CSS v4 + shadcn/ui | 保留 Lovable 原型的视觉语言 |
| 内容 | Markdown 文件 + `import.meta.glob` | 文件化管理，Obsidian 友好 |
| 部署 | Vercel（Nitro preset） | push main → 自动部署，零配置 |
| DNS | Cloudflare | 代理 + SSL，文档已写好 |
| 发布 | 自建 Publisher Dashboard | Obsidian → Git → Vercel |
| 写作 | Obsidian | 本地 Markdown，Wiki Link，图片粘贴 |

## 五、还没做完的事

- 默认 OG 图还没做（现在是 404）
- 生产域名和 `VITE_SITE_URL` 还需要配置
- `/write` 页面的定位还没想好——留作草稿 UI 还是直接隐藏？
- 移动端的视觉细节还需要真人过一遍

这些都是阻塞项——但不妨先把文章写起来。走到这一步，工程的部分已经就位了。剩下的就是把内容填满。

---

*写于 2026 年 6 月 19 日，工程化改造完成的那天晚上。后续几天在 Codex 和 ClaudeCode 交替接力下陆续完善了中文体验、SEO 和图片预览。*
