---
title: "8天从零搭建一个RAG知识库问答助手"
description: "UST Buddy 港科新生助手的完整技术复盘——Hybrid Search、图片识别、后端知识上传管线的实现思路"
date: "2026-07-09"
slug: "ust-buddy-rag知识库实践"
tags: ["Blog", "WebApp", "RAG", "AI"]
cover: ""
draft: false
publish: true
source: "obsidian"
---
五月底花了 8 天时间，给港科大新生搭了一个 AI 问答助手，叫 UST Buddy。

新生在聊天框里用中文或英文问：机场怎么去学校、宿舍怎么入住、八达通在哪办、校园有什么吃的……后端从知识库里检索相关内容，AI 基于检索结果生成回答，附上信息来源。

这篇文章把这个项目的技术路线完整复盘一遍——从 RAG 检索、模型选型、到图片识别和知识上传管线。

---

## 一、做什么：一个带来源追溯的问答机器人

整个系统分三块：

1. **用户端**：聊天界面，提问 → AI 回答 → 展示信息来源卡片
2. **管理端**：后台导入知识（Markdown、公众号文章、网页、图片、Word 文档）
3. **问答引擎**：Hybrid Search 检索 + MiniMax 生成回答

技术栈：React 19 + TanStack Start SSR + TypeScript + Tailwind CSS 4 + Supabase pgvector + MiniMax + Jina Embeddings + Vercel。

选择 SSR 而不是纯前端 SPA 的原因很简单——API key 不能暴露在浏览器里。所有对 MiniMax 和 Supabase 的调用都在服务端完成，前端只负责展示。

---

## 二、RAG 怎么做的：Hybrid Search 混合检索

RAG（检索增强生成）的核心思路是：用户提问后，先去知识库里找到最相关的几段内容，把这些内容连同问题一起塞给大模型，让它基于"参考资料"回答。

纯关键词检索的问题是——用户问"怎么去学校"，知识库里写的是"抵港交通指南"，字面上不匹配就召回不了。纯语义检索的问题是——向量相似不等于真正相关，有时会召回想关但不解决当前问题的内容。

所以 UST Buddy 用了 Hybrid Search，把两种方式的结果合并，取长补短。

### 关键词检索

关键词检索在 Supabase 里对 `document_chunks` 表做全文扫描，给每条 chunk 打分。分数来自四部分：

- 标题命中：权重 ×5
- 关键词命中：权重 ×4
- 分类命中：权重 ×3
- 正文命中：权重 ×1

这里做了两个重要优化。一是**中文分词**——用 n-gram 把中文提问拆成 2~4 字的片段分别匹配。二是**同义词扩展**——"八达通"和"octopus"虽然长得完全不一样，但指向同一个东西。代码里预设了 5 组同义词（机场/airport、宿舍/dorm/hall、八达通/octopus 等），检索时自动把同组的词全加进去搜。

### 语义检索

语义检索用 Jina Embeddings API 把提问转成向量，然后调 Supabase 的 pgvector RPC `match_document_chunks`，用余弦相似度召回最接近的 8 条 chunk。这里用了 Supabase 的 pgvector 扩展，向量检索直接在数据库里跑，不需要额外的向量数据库服务。

### 合并排序

两条管线各自跑完结果，进入合并逻辑：

```
finalScore = 关键词分(归一化) × 0.5 + 向量相似度 × 0.5 + 重叠加分(0.15)
```

关键词和向量都命中的 chunk 会额外加 0.15 分——因为两条路都找到了它，说明相关性更可靠。合并后按分数排序、按内容哈希去重、取前 6 条、截断每条的正文到 1200 字，组成最终上下文。

整个过程并行执行——关键词检索和向量检索同时发起，总延迟取决于慢的那条，而不是两条相加。

---

## 三、用了什么模型

项目用的是 MiniMax 的模型体系，没有接 OpenAI：

| 用途 | 模型 | 参数 |
|---|---|---|
| 问答生成 | MiniMax 文本模型（Chat Completions） | temperature=0.1, top_p=0.3, max_tokens=1500 |
| 图片理解 | MiniMax VLM（`/v1/coding_plan/vlm`） | 读取图片文字，输出 Markdown |
| 元数据提取 | MiniMax 文本模型（JSON mode） | temperature=0.1, max_tokens=1500 |
| 文本向量化 | Jina Embeddings API | 把文本转成向量存 pgvector |

为什么 temperature 设成 0.1？这是知识库问答，需要的不是创意，是准确。低温 + 低 top_p 让模型尽量输出确定性高的回答，减少编造。

所有模型调用都通过一个 **Model Router** 统一管理——这是一个配置驱动的路由层，Admin 在后台 Settings 页面填环境变量名（不填密钥值本身），Router 运行时从环境变量读取实际的 API key 和 base URL。换模型不需要改代码，改配置就行。

System Prompt 里还做了一件重要的事：**强制基于上下文回答**。明确告诉模型"只能使用 contextDocuments 中的信息，禁止使用外部知识"，并且给了严格的结构要求——中文回答必须包含"直接回答 → 可确认事项 → 未覆盖事项 → 小建议"四个部分。如果知识库没有相关信息，直接说"当前知识库没有覆盖这个问题"。

---

## 四、后端知识上传：多格式导入管线

知识库的内容是从管理端一条条导入的。支持五种格式：

### 1. Markdown 导入
支持 frontmatter 解析。标题、分类、关键词从前置元数据自动提取。

### 2. 公众号文章导入
粘贴公众号文章的 HTML，后端用 cheerio 解析正文，清洗标签，提取纯文本。

### 3. 网页 URL 导入
输入 URL，后端抓取网页内容，解析正文。这里做了 SSRF 防护，防止恶意输入内网地址。

### 4. Word 文档导入
用 mammoth 库把 .docx 转成 Markdown。

### 5. 图片导入（重点）

这是最复杂的一条管线，下面单独展开。

所有格式导入后的处理流程是统一的：

```
导入 → 解析成结构化文档 → 写入 Supabase documents 表
     → 按段落切分成 chunks → 写入 document_chunks 表
     → 调用 Jina Embeddings 给每个 chunk 生成向量 → 回填到 pgvector
```

Embedding 回填是"尽力而为"模式——某条失败了不会阻塞其他条，日志里会记录失败原因。导入完成后还有**语义去重检查**：用向量相似度对比新内容和已有内容，提醒 Admin 是否可能重复。

---

## 五、图片识别：VLM 主 + OCR 备

图片导入是整条管线的技术亮点。不是简单的"OCR 提取文字就完事"，而是一条带 fallback 的双路架构：

### 主路径：MiniMax VLM 视觉理解

用户上传图片（支持 PNG/JPEG/WebP，最大 20MB），后端把图片转成 base64，调用 MiniMax 的 VLM 接口（`/v1/coding_plan/vlm`），用一段中文 prompt 告诉模型：

> "你是图像文字理解助手。请读取图片中的所有可见文字，整理成适合知识库导入的 Markdown 正文。保留标题、段落、列表结构。不要编造图片中没有的信息。"

VLM 的优势在于它不只是做 OCR——它能理解图片的**结构**。一张长截图里的标题、正文、列表层级，VLM 能自动识别并输出格式良好的 Markdown。传统 OCR 只会给你一堆文字流。

### 备用路径：tesseract.js OCR

如果 VLM 调用失败（超时、报错、网络问题），自动切到 tesseract.js 做 OCR。语言包配置了英文 + 简体中文（eng+chi_sim），60 秒超时。

### 元数据提取

无论走哪条路径拿到的文字，接下来都会调 MiniMax 文本模型（JSON mode）提取结构化元数据：

- **title**：简洁标题
- **category**：arrival / housing / transport / life / academic / food / shopping / official / course / other 十选一
- **keywords**：8-15 个中英文关键词
- **summary**：一句话摘要

这一步把非结构化的图片变成了结构化的知识条目——有标题、有分类、有标签、有正文，和其他格式导入的文档完全一致，可以统一检索。

---

## 六、架构总览

把上面的所有组件串起来，完整的数据流是这样的：

```
┌─ 管理端 ─────────────────────────────────────┐
│  Markdown / 公众号 / URL / DOCX / 图片        │
│        │                                       │
│        ▼                                       │
│  解析器（cheerio/mammoth/VLM/OCR）             │
│        │                                       │
│        ▼                                       │
│  元数据提取（MiniMax JSON mode）               │
│        │                                       │
│        ▼                                       │
│  Supabase documents + document_chunks           │
│        │                                       │
│        ▼                                       │
│  Jina Embeddings → pgvector 回填               │
└───────────────────────────────────────────────┘

┌─ 用户端 ─────────────────────────────────────┐
│  用户提问                                      │
│     │                                          │
│     ├──→ 关键词检索（Supabase term scoring）   │
│     │                                          │
│     └──→ 向量检索（Jina embedding → pgvector）│
│                │                               │
│                ▼                               │
│     合并 + 去重 + 排序（Hybrid Merge）         │
│                │                               │
│                ▼                               │
│     MiniMax 文本模型 生成回答                   │
│                │                               │
│                ▼                               │
│     回答 + 去重来源卡片 返回前端               │
└───────────────────────────────────────────────┘
```

---

## 七、工程上的取舍

8 天 32 次提交，从原型到可交付的 v1.0，中间做了不少取舍：

**选择 TanStack Start SSR 而不是 Vite SPA**。因为 MiniMax API key 必须放在服务端。SSR 让前端代码和服务端代码在同一个项目里，API 路由直接在后端跑，不需要单独搭一个 Express 服务。

**选择 Hybrid Search 而不是纯向量检索**。纯向量检索在知识库规模小的时候效果不稳定——embedding 模型的理解能力和用户的实际提问方式之间总有差距。关键词检索作为补充，能兜底很多向量召回不理想的情况。

**选择 Model Router 可配置而不是硬编码模型**。刚开发时 MiniMax 是唯一选项，但谁知道以后会不会换？Router 把 provider/model/api-key 全部抽象成配置项，换模型只需要改 Settings 页面里的字段名，不用改一行业务代码。

**Admin 用共享 Token 而不是完整登录系统**。v1.0 的使用场景是单一管理员导入知识，不需要多用户权限体系。简单 Token 验证足够安全，也节省了大量开发时间。
