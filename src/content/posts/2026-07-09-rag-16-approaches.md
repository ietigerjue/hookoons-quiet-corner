---
title: "RAG 16 种方案笔记"
description: "从 Naive RAG 到 Agentic RAG，16 种 RAG 方案的原理、适用场景、代码片段和选型指南"
date: "2026-07-09"
slug: "rag-16-approaches"
tags: ["Blog", "AI", "RAG", "LLM"]
cover: ""
draft: false
publish: true
source: "obsidian"
---
阅读：[程序员鱼皮 - RAG 是什么？16 种 RAG 方案一次讲清](https://www.cnblogs.com/yupi/p/19914426)（2026-04-23）

---

## 为什么需要 RAG

大模型三个硬伤：知识截止、幻觉、无私有知识。

百万 token 上下文窗口不能替代 RAG，原因：token 费随长度涨；Lost in the Middle（中间部分注意力下降）。

最佳实践：RAG 做精准筛选 + 长上下文做深度推理，互补而非互斥。
![Pasted image 20260709151956.png](/images/posts/rag-16-approaches/Pasted-image-20260709151956.png)

---

## 全景

```
基础检索:       Naive RAG → Multi-Query RAG → HyDE
检索质量:       语义分块 → 层级索引 → Hybrid Search → Reranking
自我纠错:       Corrective RAG → Self-RAG → Adaptive RAG
结构化知识:     GraphRAG → Text-to-SQL RAG
智能体驱动:     Agentic RAG → Multi-Agent RAG
能力扩展:       多模态 RAG → Speculative RAG
```

---

## 基础检索

### Naive RAG

核心：向量。文字→数字串，语义近的向量空间距离近。

流程：

```
离线：文档 → chunk(500字/50重叠) → Embedding → 向量数据库
在线：问题 → Embedding → 向量搜索(Top 5) → Prompt组装 → LLM生成
```

```python
chunks = split_into_chunks(docs, chunk_size=500, chunk_overlap=50)
for c in chunks:
    vector_store.insert(embed(c), c)

q_vec = embed(query)
top_k = vector_store.search(q_vec, k=5)
answer = LLM.generate("参考资料：\n" + top_k + "\n问题：" + query)
```

三个问题：切块截断语义、检索全看 embedding 质量、垃圾文档照用。

### Multi-Query RAG

LLM 把原问题改写为多个表述 → 分别检索 → 合并去重。

适用：客服、电商等口语化场景。代价：多一次 LLM 调用 + N 次检索。

```python
queries = LLM.generate("改写为3个表述：" + query)
all_results = []
for q in queries:
    all_results.extend(vector_store.search(embed(q), k=5))
merged = deduplicate(all_results)
answer = LLM.generate(merged + query)
```

### HyDE（Hypothetical Document Embeddings）

问题：用户 query 短，文档长，向量空间距离远。

做法：LLM 先编假答案 → 用假答案向量检索 → 假答案和真文档文体接近，命中率更高。

```python
hypo = LLM.generate("请回答：" + query)
hypo_vec = embed(hypo)
top_k = vector_store.search(hypo_vec, k=5)
answer = LLM.generate(top_k + query)
```

风险：假答案方向跑偏则更差。冷门领域慎用。

**区分**：Multi-Query 改问题，HyDE 编答案。

---

## 检索质量

### 语义分块（Semantic Chunking）

按句子 embedding 相似度骤降点切块，替代固定字数。

文档→拆句→算相邻句相似度→骤降处切一刀。

适用：会议纪要、访谈。代价：每句算 embedding，阈值难调。有章节标题的文档直接按标题切更便宜。

### 层级索引（Parent-Child Retrieval）

大块→小块两层。小块精确匹配检索，返回时给整个大块（保证上下文完整）。

类比：数据库索引回表。

适用：技术手册、法律合同等需上下文的长文档。

### Hybrid Search 混合检索

向量搜索（语义）+ BM25（精确匹配），RRF 融合排序。

```
Query → ├─ 向量检索(Top 20)
        └─ BM25关键词(Top 20)
        → RRF融合 → Top 5 → LLM
```

几乎所有生产环境必用，尤其术语密集领域（技术文档、医疗、法律）。

### Reranking 精排

级联筛选：

```
粗检索(K=150, 保召回) → 轻量Reranker(Top 20) → Cross-Encoder精排(Top 5) → LLM
```

粗排保不遗漏，精排保不掺假。语料库 > 10 万 chunk 时效果提升显著。

**生产级三板斧**：语义分块 + Hybrid Search + Reranking。

---

## 自我纠错

核心问题：搜到垃圾文档，LLM 照样一本正经基于垃圾生成答案。

### Corrective RAG（CRAG）

检索和生成间插质检员，逐文档打分：

- 高分 → 喂 LLM
- 低分 → 降级到 Web 搜索
- 模糊 → 合并两边结果

关键是低分降级分支：内部搜不到自动切 Web，不硬答。

### Self-RAG

四个检查点全程自我审视：

| 检查点 | 问题 |
|---|---|
| Retrieve | 需要检索吗？ |
| IsRel | 文档相关吗？ |
| **IsSup** | 回答有文档支撑吗？（价值最高，防幻觉） |
| IsUse | 答案有用吗？ |

### Adaptive RAG

前面加分类器，按复杂度分流：

- 简单（"你好"）→ 直接答
- 一般 → 检索一次
- 复杂 → 完整 CRAG

适用：流量混杂场景。

---

## 结构化知识

### GraphRAG（Microsoft Research, 2024）

解决跨文档多跳推理。

示例：文档A"张三是AI部门负责人" + 文档B"AI部门属技术中心" → 推理：张三属技术中心。纯向量检索只能搜到A。

流程：
```
离线：文档 → LLM抽实体+关系 → 知识图谱 → Leiden社区划分 → 社区摘要
在线：定位实体 → 沿关系遍历2跳 → 子图+摘要 → LLM生成
```

代价：构建成本远高于向量索引。简单查询没必要用。

### Text-to-SQL RAG

结构化表格做 embedding 低效。让 LLM 翻译成 SQL，执行查询，结果喂 LLM 组织回答。

```
Query → LLM→SQL → DB执行 → 结果 → LLM自然语言回答
```

安全：生产环境必须只读权限 + SQL 审计 + 沙盒隔离。

---

## 智能体驱动

前面都是预定义 pipeline，流程固定。现实问题千变万化。

### Agentic RAG

给 Agent 配工具集（向量搜索、Web 搜索、SQL、图谱遍历…），ReAct 循环自主决策：

```
思考 → 选工具 → 执行 → 观察 →
  ├─ 信息够了 → 生成
  └─ 不够 → 换工具/关键词再搜
```

Cursor 代码搜索即用此范式。2026 年已是主流生产方案。

### Multi-Agent RAG

拆为专职 Agent：Router（分发）→ 各领域 RAG Agent（检索推理）→ Verifier（质检）→ Writer（润色）。

单 Agent 兼顾多职责时 Prompt 过长，决策质量下降。

适用：多数据源、多权限、多语言的企业级知识库。

---

## 能力扩展

### 多模态 RAG

文本+图片+表格统一编码到同一向量空间 → 跨模态检索 → VLM 处理混合内容。

纯文本 RAG 处理带架构图的文档，图片信息全丢。

### Speculative RAG

检索(K=15) → 拆 N 个子集 → N 个小模型并行生成草稿 → 大模型验证选最佳。

借鉴推测性解码，降延迟。

---

## 选型

| 场景 | 方案 |
|---|---|
| 刚起步 | Naive RAG |
| 用户口语化 | Multi-Query RAG / HyDE |
| 生产环境 | Hybrid Search + Reranking |
| 不能忍幻觉 | Corrective RAG / Self-RAG |
| 查询复杂度差异大 | Adaptive RAG |
| 跨文档多跳推理 | GraphRAG |
| 结构化表格为主 | Text-to-SQL RAG |
| 大量图表/图片 | 多模态 RAG |
| 多数据源混合 | Agentic RAG / Multi-Agent RAG |
| 延迟敏感 | Speculative RAG |

起步：Naive RAG → 发现具体问题 → 针对性加方案。不搞全家桶。

---

## 评估：RAGAS

| 指标 | 含义 |
|---|---|
| Faithfulness | 回答有无依据（有无瞎编） |
| Answer Relevance | 是否答了所问 |
| Context Precision | 搜到的有多少有用 |
| Context Recall | 该搜到的搜到了吗 |

---

## 相关生态

编排：LangChain/LangGraph、LlamaIndex | 平台：Dify、RAGFlow | 向量库：Chroma、Milvus、Qdrant
