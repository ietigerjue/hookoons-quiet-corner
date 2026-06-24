---
title: "Harness和Loop工程实践"
description: "Harness和Loop工程"
date: "2026-06-24"
slug: "harness和loop工程"
tags: ["Blog", "Workflow"]
cover: ""
draft: false
publish: true
source: "obsidian"
featured: true
---
这段时间我一直在研究 Claude Code、Codex 这类 AI 编程 Agent。用得越多，越会发现一个问题：

**真正决定 Agent 能不能长期稳定工作的，不是某一次 prompt 写得多好，而是背后的工程系统设计得好不好。**

一个成熟的 Agent 编程系统，不能只靠“人不断给指令”。它需要有自己的输入管理、权限控制、任务记忆、工具调度、多 Agent 协作和结果验证机制。

这套系统，可以理解为 **Harness**。  
而让 Agent 持续行动、观察、修正的循环机制，就是 **Loop**。


## 什么是 Harness？

Harness 可以理解为 Agent 的“执行控制系统”。

它不是一个 prompt，也不是一个简单脚本，而是一套让 Agent 能够稳定运行的基础设施。

一个成熟的 Harness 至少要解决这些问题：

- Agent 从哪里接收任务？
- 它能读取哪些上下文？
- 它能调用哪些工具？
- 哪些操作需要用户确认？
- 执行过程如何记录？
- 结果如何验证？
- 下次继续任务时，如何恢复状态？
- 多个 Agent 同时工作时，如何避免冲突？

所以，Harness 的核心不是“让 Agent 更聪明”，而是：

**让 Agent 的执行过程更可控、更可观察、更可持续。**

---
## 二、Harness 的整体架构

![Pasted image 20260624190408.png](/images/posts/harness和loop工程/Pasted-image-20260624190408.png)

一个 Agent Harness 可以拆成 8 个层级。

### 1. 输入层：接收任务，但不直接乱执行

输入层负责接收用户请求，比如来自 CLI、IDE 或自动化流程。

但任务进来之后，Agent 不应该马上执行，而是先经过：

- 会话恢复
- 上下文加载
- 权限判断
- 风险分级

尤其是权限门很关键。  
读文件、搜索内容、创建新文件，和删除文件、改配置、批量重构，风险完全不同。

成熟的 Agent 系统应该区分：

- 可以自动执行的操作
- 需要记录的操作
- 必须用户确认的操作

这一步让Agent开工前知道自己能干什么，不能干什么。

| 模块                  | 功能                               |
| ------------------- | -------------------------------- |
| **User Interface**  | 用户交互入口：CLI、IDE、CI/CD pipeline \| |
| **Session Manager** | 会话恢复、分支会话、持久化状态                  |
| **Permission Gate** | 操作分级：拒绝 / 允许 / 需审批               |
| **YAML Rules**      | 权限行为规则，按风险分 3 级                  |

---

### 2. 知识层：让 Agent 不再每次从零开始

知识层负责管理 Agent 的长期上下文。

它通常包括：

- **Skill Registry**：按需加载技能
- **Context Compressor**：压缩过长上下文
- **Task Graph**：记录任务依赖和优先级
- **Memory Store**：保存跨会话记忆

这里最重要的思想是：

**不要把所有东西都塞进上下文，而是让 Agent 在需要时检索和加载。**

否则上下文会越来越长，噪音越来越多，最后 Agent 反而更容易误判。

好的记忆系统应该只保留真正有价值的信息，比如：

- 当前项目状态
- 已确认的技术决策
- 关键错误和修复方式
- 重要产物索引
- 下一步任务
- 回滚方案

| 模块                     | 功能                      |
| ---------------------- | ----------------------- |
| **Skill Registry**     | 按需注入skill，不一次性加载所有skill |
| **Context Compressor** | 上下文压缩                   |
| **Task Graph**         | 任务依赖关系和优先级管理            |
| **Memory Store**       | 跨会话持久化存储                |

---

### 3. 主循环：Agent 真正工作的核心

整个架构的中心是 **Master Agent Loop**。

它不是一次性的“提问—回答”，而是一个持续循环：

**Perception → Action → Observation**

也就是：

1. **Perception** **感知**：读取任务、记忆、权限、工具和当前状态
2. **Action** **行动**：调用工具、读写文件、运行命令、派生子 Agent
3. **Observation** **观察**：查看结果、报错、测试反馈和文件变化
4. 再进入下一轮循环


![Pasted image 20260624190653.png](/images/posts/harness和loop工程/Pasted-image-20260624190653.png)


---

### 4. 执行层：把想法变成真实操作

执行层负责调用具体工具。

常见能力包括：

- 运行命令
- 读取文件
- 写入文件
- 搜索代码
- 修改内容
- 回滚变更
- 并行执行任务

这一层的重点是：

**每一次工具调用都应该可追踪、可记录、可回滚。**

- 每种工具（bash、read、write、grep、glob、revert）通过类型化注册表管理，每工具一个处理器
- 执行支持实时流式反馈和并行执行
- prompt cache 通过复用稳定前缀降低 90% 的上下文成本
- `cache_control` 信号影响运行时上下文组织和工具调用效率

| 模块                    | 功能                   |
| --------------------- | -------------------- |
| **Tool Dispatch**     | 类型化注册表，每工具一个 handler |
| **Streaming Runtime** | 实时反馈 + 并行执行          |
| **Prompt Cache**      | 复用稳定 prompt 前缀，降成本   |

---

### 5. 集成层：连接外部工具和服务


真正有用的 Agent 需要连接：

- 文件系统
- Git
- 浏览器
- 搜索工具
- 数据库
- CI/CD
- 外部 API
- MCP Server

这就是集成层的作用。

通过 MCP 或类似机制，Agent 可以动态发现工具，并把外部能力注册进自己的执行系统。

| 模块                   | 功能                    |
| -------------------- | --------------------- |
| **MCP Runtime**      | 自动发现 MCP Server 并注册工具 |
| **External Servers** | 文件系统、Git、自定义服务        |

MCP Runtime 与 External Servers 之间的工具发现和调用关系，使 Agent 可以通过**统一接口**访问外部能力。集成层通过虚线向执行层注册工具（`register tools`）。

---

### 6. 输出层：不是生成结果，而是验证结果

很多人用 Agent 时容易忽略这一点：

Agent 说“完成了”，并不代表真的完成了。

输出层要做的是：

- 检查结果是否符合任务要求
- 测试是否通过
- 文件是否正确生成
- 关键状态是否更新
- 是否需要写入记忆
- 是否产生新的后续任务


---

### 7. 可观测层：让 Agent 不再是黑盒

可观测层负责记录 Agent 的运行过程。

它可以通过 Event Bus、Hooks、日志和后台任务记录：

- 任务什么时候开始
- 调用了哪些工具
- 改了哪些文件
- 哪一步报错
- 哪一步需要人工确认
- 任务什么时候结束
- 最终状态是什么

没有可观测层，Agent 系统就会变成黑盒。

一旦出错，你只能说“它好像改坏了”，但不知道具体是哪一步出了问题。

| 模块                      | 功能                    |
| ----------------------- | --------------------- |
| **Event Bus**           | 监听生命周期事件，支持 Hook 拦截   |
| **Background Executor** | 非阻塞后台任务（异步日志、索引、持续检查） |
事件总线监听的关键生命周期事件：任务开始、工具调用、权限判断、文件修改、错误发生、任务结束。

---

### 8. 多 Agent 层：分工、隔离和冲突控制

多 Agent 并不是简单地“同时开几个 Agent”。

真正的多 Agent 系统需要解决：

- 子 Agent 的上下文隔离
- Agent 之间如何通信
- 谁负责写代码
- 谁负责审查
- 谁能认领任务
- 多个任务如何避免冲突
- 分支如何合并

所以多 Agent 层通常会包括：

- Subagent Spawner：派生子 Agent
- Mailboxes：Agent 间消息传递
- FSM Protocol：状态机协议
- Autonomous Board：任务看板
- Worktree Isolator：独立工作区隔离

其遵循以下原则：
- 子 Agent 的上下文必须**隔离**，不能污染主 Agent 的上下文窗口
- Agent 之间通过邮箱/消息队列通信，不是直接共享内存
- 状态机协议（FSM）是必须的——没有状态机，多 Agent 协作必然混乱
- 任务看板支持自主领取 + 原子锁，防止两个 Agent 抢同一个任务
- Worktree 隔离确保并行修改不冲突，合并时仍需冲突检测

| 模块                     | 功能                       |
| ---------------------- | ------------------------ |
| **Subagent Spawner**   | 派生子 Agent，隔离上下文，避免污染主上下文 |
| **Teammate Mailboxes** | Agent 间通信（消息队列）          |
| **FSM Protocol**       | 协作状态机协议，避免任务状态混乱         |
| **Autonomous Board**   | 自主领取任务，原子锁防冲突            |
| **Worktree Isolator**  | 每任务独立 worktree/分支，零冲突    |


---

## 核心设计原则总结

从这张 Claude Code Architecture 图中可以提炼出 **7 条 Harness 设计原则**：

| #   | 原则        | 含义                                                       |
| --- | --------- | -------------------------------------------------------- |
| 1   | **分层架构**  | 输入、知识、执行、集成、输出、可观测、多 Agent 各司其职                          |
| 2   | **主循环驱动** | 一切围绕 Perception → Action → Observation 循环运转              |
| 3   | **可观测性**  | Event Bus + Hooks 观察一切，实现可调试、可审计                         |
| 4   | **持久化记忆** | 跨会话 Memory Store + Context Compressor 写入长期记忆             |
| 5   | **可扩展性**  | Skill Registry（按需注入）+ MCP Runtime（动态工具注册）                |
| 6   | **可回滚**   | Worktree 隔离 + 冲突检测 + 回滚机制                                |
| 7   | **闭环验证**  | Output Layer 要求 Verified output + Memory updated，不做一次性对话 |

---

## 三、Loop 工程：从一次性 prompt 到自主循环

![Pasted image 20260624191039.png](/images/posts/harness和loop工程/Pasted-image-20260624191039.png)


如果说 Harness 是 Agent 的「身体」，Loop 就是 Agent 的「心跳」。Addy Osmani 的定义一针见血：

> *"Loop = 你设计一个系统替你 prompt Agent，而不是你亲手 prompt。"*

### Loop 五件套 + Memory

一个完整的 Loop 包含五个组件加一个持久层：

**1. Automations（心跳）**

> *"A loop that only runs when you call it isn't a loop, it's a script."* — Addy Osmani

| 工具 | 场景 |
|---|---|
| ClaudeCode `/loop` | in-session 循环（每 N 分钟重跑同一 prompt） |
| `CronCreate` | 跨 session 定时（每天定时检查、生成日报） |
| `/goal` | 跑直到条件为真（「所有测试通过且 lint 干净」） |
| GitHub Actions | 长期后台，笔记本关机也跑 |

**`/goal` 的关键设计**：跑代码的 Agent 不判断「做完了没」——另一个小模型判断。这是 maker/checker 分离应用到停止条件本身。Cherny 说这就是 Claude Code 的 `/goal` 底层做的事：*"a fresh model decides if the loop is done instead of the one that did the work"*。

**2. Worktrees（并行隔离）**

任何两个 Agent 改同一 repo 都必须用独立的 git worktree。affaan 的 Cascade 模式：左侧终端写代码，右侧终端做研究——各自独立分支，最后 merge。

**3. Skills（意图外置）**

不要每次在 prompt 里写「你应该这样做」——写成 Skill 文件，Loop 触发时自动加载。一个 Loop 的成功标志：换个人跑同样的 Loop，结果一致。

**4. Plugins / Connectors**

一个只在本地跑的 Loop 是半成品。真正有用的 Loop 能开 PR、链接 ticket、CI 绿了后 ping 频道。MCP 协议是连接这一切的统一接口。

**5. Sub-agents（maker / checker 分离）**

> *"The model that wrote the code is way too nice grading its own homework."* — Addy Osmani

核心原则：写代码的 Agent 不能审查自己的代码。ClaudeCode 写，Codex 审。sub-agent 不复用——每个 review 起新的，不允许同一个 reviewer 看第二次。

**+ Memory**

Loop 之间必须落盘。"The model forgets everything between runs so the memory has to be on disk and not in the context." — Addy Osmani.

短期存 `.tmp` 文件（loop 内状态），中期存项目记录文件（跨 session 状态），长期存归档总结（项目结束后复用）。以及两个专门为 loop 设计的记忆模式：

- **Triage Inbox**：自动化 loop 的产出物进入结构化收件箱。有 findings 的留给人看，没 findings 的自动归档。不加 triage 的话，loop 跑完的产物散落在 session checkpoint 里，找不到也追溯不了。
- **Loop State File**：和 session checkpoint 不同——checkpoint 告诉**人**接下来做什么，loop state file 告诉 **loop 自己**下一轮该做什么。记录「什么试过了、什么过了、什么还开着」——这是 loop 的脊柱。

### 一个完整的 Loop 长什么样

Addy Osmani 给出了一个每天运行的完整 Loop 示例：

> 每天早上 automation 触发 → triage skill 读昨天的 CI 失败、open issues、最近 commits → 写 findings 到 triage 文件 → 对每个值得修的 finding，开独立 worktree → sub-agent 起草修复 → 第二个 sub-agent 对照项目 skills 和已有测试审查修复 → connectors 开 PR + 更新 ticket → 处理不了的进 triage inbox 等人看 → state file 记住什么试过了、什么过了、什么还开着 → 明天早上下一轮 pick up


### Loop 不会替你做的事——三个越强越尖锐的问题

1. **Verification 还是你的责任**。Unattended loop = unattended mistakes。拆分 verifier sub-agent 是为了让 loop 的「做完了」有意义，但即使这样，「做完了」也是声称而非证明。

2. **Comprehension debt 增长更快**。Loop 写代码的速度远超你读代码的速度。Loop 越顺滑，你理解的和实际存在的之间的差距越大。

3. **Cognitive surrender 是最危险的姿势**。Loop 自己跑的时候，很容易就不再动脑，loop 给什么接什么。

### Ralph Loops：把单 session Agent 变成多 session Agent

Addy Osmani 描述了一个巧妙的模式——Ralph Loop：


原理简单但有效：Agent 说「我做完了」→ hook 拦截 → 把原始目标重新注入全新的上下文窗口 → Agent 从上次的文件状态继续。每次迭代从干净的 context 开始，但通过文件系统读取上一轮的状态。这就是把单 session Agent 变成多 session 自主运行 Agent 的关键。

### Loop 工程的核心原则

| 原则                     | 含义                                  |
| ---------------------- | ----------------------------------- |
| **心跳 > 手动**            | Loop 必须自己跑，不能每次等人触发                 |
| **落盘 > 上下文**           | Loop 之间的状态存在文件系统，不靠 context 记忆      |
| **隔离 > 共享**            | 并行 Agent 必须 worktree 隔离，merge 时检测冲突 |
| **分离 > 合并**            | Maker 和 Checker 必须是不同的 Agent        |
| **skill 化 > prompt 化** | 固定流程写成 Skill，不在 prompt 里重复          |
| **精简 > 全量**            | session checkpoint 只写接续点，不写 why     |

## 四、记忆库：Harness 和 Loop 的地基

在讲怎么搭 Harness 和 Loop 之前，得先聊一个更底层的东西——记忆。

很多人刚开始用 Agent 的时候，第一反应是：为什么它关掉窗口再开就什么都不记得了？这是因为 LLM 本身是无状态的。每次对话对它来说都是从头开始。它看起来「记得」，其实是你用的客户端偷偷把历史消息又发了一遍。

聊天场景下这还能凑合——每轮几百个 token，多念几遍撑得住。但 Agent 不行。Agent 在长跑：调工具、读文件、跑测试、再调工具。跑着跑着上下文就爆了。你不能指望它每次都把昨天的对话全念一遍。

所以，想让 Agent 长期稳定工作，第一件事不是写 prompt，是搭记忆库。

### 为什么不用向量数据库

业界给 Agent 做记忆的主流方案是向量检索——把记忆转成 embedding，存进向量数据库，每次用相似度匹配召回 top-K。Mem0、Letta、Zep 都是这条路。

听起来很合理，但实际用起来问题不少：相似不等于相关，换 embedding 模型召回结果天差地别，维护一套向量数据库的工程量比写 Agent 主流程还大。而且最要命的是——存进去的是一堆 768 维浮点数，人脑读不懂，出错了你都不知道是哪条记忆惹的祸。

Claude Code 的做法就很有意思了：它没用向量数据库，没用 embedding，而是用纯文件系统。每条记忆是一个独立的 markdown 文件，带 YAML frontmatter 标识身份。一个 MEMORY.md 索引文件列出所有记忆的目录，Agent 启动时只加载索引，需要哪条再读正文。简单，但好用。

我照着这个思路搭了自己的记忆库。

### 四种类型，不多不少

不是什么东西都往里存。记忆被限定为四种类型，每条写入前必须先想清楚「这属于哪一类」：

| 类型 | 用途 | 例子 |
|---|---|---|
| `user` | 用户画像 | 「写了十年 Go，刚接触 React」 |
| `feedback` | 行为偏好 | 「测试不要用 mock，要打真实数据库」 |
| `project` | 项目动态 | 「移动端 3 月 5 号开始合并冻结」 |
| `reference` | 外部指针 | 「pipeline bug 在 Linear 追踪」 |

其中 feedback 和 project 有强制格式——必须包含 Why（为什么有这个要求）和 How to apply（什么情况下生效）。只记规则不记原因的话，Agent 碰到边界情况就不知道该不该破例。比如「不要用 mock」加上「因为上季度 mock 测试通过了但生产迁移挂了」，Agent 自己就能判断什么场景可以例外。

project 类型还有个硬要求：相对日期必须转绝对日期。用户说「周四之前冻结」，存进去得是「2026-03-05 之前冻结」。「周四」过几天就过期了。

### 不该存的东西

跟「存什么」同样重要的是「不存什么」。Claude Code 的源码里有一份明确的禁令清单，我直接搬过来了：

- 代码模式、文件路径、项目结构 —— grep 能查到，存了反而和实际状态脱节
- Git 历史和最近改动 —— git log 是权威，记忆只会落后
- 调试方案和修复方法 —— commit 已经记录
- CLAUDE.md 里已经写过的内容 —— 避免源头分裂
- 临时任务状态和当前对话 —— 会话级的，不该跨会话

核心原则一句话：**只记代码推不出来的东西。** 写入前问自己：如果我不写这条，Agent 下次能通过读代码或 git log 自行获取吗？如果能，就不写。

### 记忆会过期

代码是活的，记忆是死的。一条记忆存进去就定格了，但代码随时在变。如果记忆说「AuthService 在 xxx.ts 第 42 行」，代码一重构，这条记忆就变成了一个「权威的错误」——比没记忆还糟糕。

所以记忆系统必须有时效管理：

| 记忆年龄 | 行为 |
|---|---|
| 今天 / 昨天 | 正常加载 |
| 2-7 天 | 加载时附加提醒：此记忆已保存 N 天，使用前请验证 |
| 8-30 天 | 加载时加强警告 |
| 超过 30 天 | 标记为待审查，不主动加载 |

而且 Agent 在使用记忆前必须先验证——记忆说某个文件存在，先去检查文件在不在。记忆说某个函数叫这个名字，先去 grep。记忆不是真理，是历史快照。

### 记忆不是手写的

有了规则，下一个问题是：记忆谁来写？

最朴素的做法是让 Agent 自己写——每轮结束让它想想「这次有啥该记的」。但这里有两个坑：一是模型分心，主任务都做不好还要分脑子想记什么；二是 token 浪费，每轮都得在 system prompt 里塞一段「记一下偏好啊」的指令。

Claude Code 的做法是：每轮对话结束后，后台单独跑一个代理来抽取记忆。这个代理是主对话的 fork——复用主对话的 prompt cache，不用重新加载几千 token 的 system prompt，只需要看着对话历史，判断这次有没有值得记的东西。

我简化了一下：每次会话结束时，Stop hook 自动触发——从 transcript 里提取改了什么文件、用了什么工具，生成一个精简的进度 checkpoint。checkpoint 只写两件事：改了什么文件、下一步做什么。Why 和项目背景写到项目记录里，不混在一起。

另外每天定时扫描最近的 session 记录，检测跨会话反复出现的热点文件和用户纠正模式，生成候选 skill 建议。人工确认后才创建记忆文件——自动化程度是 80%，最后 20% 的决策权留给人。

---

## 五、我的 Harness：让记忆库之上的东西自己转

记忆库是地基。但光有记忆不够——你需要一套系统让 Agent 能稳定地接收任务、调用工具、记录过程、验证结果。这就是 Harness。

回到最前面那句话：Agent = Model + Harness。如果你不是模型，你就是 Harness。模型只是其中一个输入，其余全是你设计的脚手架。

下面是我实际在用的 Harness。

### 权限和 Sandbox

任务进来先过权限门。读文件和搜索自动放行。删除、覆盖、批量操作必须用户确认。危险命令（rm -rf、git push --force、DROP TABLE）在 sandbox 层面直接拦截。

这条原则和其他东西不一样——Sandbox 不能等事故。hooks 可以「出了事再加」，但 rm -rf / 这种事，事故成本远高于预防成本。

### Hook 体系

Hook 是把「你告诉 Agent 要做 X」升级为「系统强制 X 执行」的关键。Addy Osmani 提过一个很好的模式：success is silent, failures are verbose。typecheck 过了 Agent 什么也不听到，挂了才出声。

目前配了三个 Hook：

| Hook | 什么时候触发 | 干嘛 |
|---|---|---|
| Stop | 会话结束 | 自动生成进度 checkpoint |
| PreCompact | 上下文压缩前 | 先把关键状态 dump 到文件，防止被压糊 |
| PreToolUse | 每次工具调用 | 累计计数，100 次后提醒考虑 compact |

Hook 的启用是渐进的——从 minimal（只有一个 Stop hook）开始，出事了再升级到 standard 或 strict。不和没发生的事打仗。

### Agent 协作

我为了防止单一Agent出现给自己提高打分的情况，其实一直都是claudecode和codex一起用的，Claudecode负责执行，Codex负责审查，有的时候codex的额度烧完了还得要ClaudeCode继续工作。
但我发现如果只是单纯的记录session-log让他们每次交接的时候读这个log，不仅维护麻烦，还会撑爆上下文。
所以我用了状态管理的方法
任务交接不是「发个文件就等着」。用了显式的状态机：8 个状态，每个转换有锁保护。Codex 认领审查任务时获取锁，把 Handoff 的 status 从 pending_review 改为 in_review。24 小时不回应，锁自动释放，防止任务丢失。

当执行的一方复杂任务完成后会独立生成一个 subagent 验证成果。当然为了省token都是用便宜的模型，而且硬性规定不能生成超过6个subagents。

### Harness控制面

为了我看的方便我也做了一个dashboard，实时显示：当前有几个活跃 session、Handoff 是什么状态、有没有锁被持有、最近 compact 了几次。30 秒自动刷新，基于 Python 标准库。
![Pasted image 20260624201136.png](/images/posts/harness和loop工程/Pasted-image-20260624201136.png)
### 自我迭代

Harness 搭完不是终点。配了两个自动引擎：

一个是**定时 audit**——每天早上的 cron 任务自动检查 6 个关键信号：session 有没有在正常记录、规则文件是否完整且有溯源、有没有 Handoff 积压超过 3 个、脚本是否全部可执行等等。发现 gap 写进 triage 文件，只报告不自动修。

另一个是 **pattern 提取**——扫描最近的 session 历史，找跨会话反复出现的热点文件和用户纠正模式，自动创建热点记忆——同一文件被 3 个以上 session 反复修改直接创建，context 压缩超阈值自动生成优化建议，全程不需要确认。


---

## 六、Loop：让 Harness 自己转起来

Harness 是身体，Loop 是心跳。Harness 搭好了，如果每次还得人手动触发，那它还是一个脚本，不是一个 Loop。

Addy Osmani 有句话说得很好：*"A loop that only runs when you call it isn't a loop, it's a script."*

### 正在跑的定时任务

| 任务                 | 频率      | 做什么                                                |
| ------------------ | ------- | -------------------------------------------------- |
| Audit + Pattern 提取 | 每天 9:17 | 检查 harness 6 个健康信号 + 扫描 session 自动提取模式为 skill |
| Context 监控         | 会话中实时   | PreToolUse hook 每 100 次工具调用提醒考虑 compact            |

这 6 个健康信号是：

| 信号 | 检查什么 | 怎么判断 |
|---|---|---|
| Live Status | session checkpoint 是否正常生成 | 今天有没有新的 checkpoint |
| Session Traces | compact 事件是否被记录 | compact-log 有没有条目 |
| Harness Baseline | 规则文件是否完整且有溯源 | 全部规则是否都有事故出处 |
| Risk Ledger | 回滚记录是否存在 | 回滚文件存在就过 |
| Progress Sync | Handoff 有没有积压 | 超过 3 个待审查的 Handoff 需关注 |
| Script Health | 脚本是否全部可执行 | 所有脚本是否有执行权限 |

`/goal` 模式也在用——设定一个条件，让 Agent 自己跑到满足为止，比如「所有测试通过且 lint 干净」。关键设计是条件的验证由独立模型完成：写代码的 Agent 不自己判断「做完了没」。

### 状态怎么存

Loop 之间的状态全部落在文件系统，不靠上下文记忆。三种状态文件各司其职：

| 文件 | 给谁看 | 存什么 |
|---|---|---|
| Session checkpoint | 人（下次会话接续） | 改了什么文件、下一步做什么 |
| Loop state file | Loop 自身（下一轮迭代） | 什么试过了、什么过了、什么还开着 |
| Triage | 人 + 下一轮 Loop | 自动化跑出来的 findings |

checkpoint 告诉人接下来做什么，loop state file 告诉 loop 自己下一轮该做什么，triage 管收件箱。各管各的，不混。

---

## 参考

- [Addy Osmani — Agent Harness Engineering](https://addyosmani.com/blog/agent-harness-engineering/)
- [Addy Osmani — Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
- [小林coding — Claude Code 记忆机制源码解析](https://mp.weixin.qq.com/s/CLIuogpYSPng2brQph7AHg)
- [affaan — ECC Harness](https://github.com/affaan-m/ECC)
