export type Project = {
  slug: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  tags: string[];
  status: "active" | "building" | "paused";
  postCount?: number;
  href?: string;
};

export const PROJECT_DEFINITIONS: Project[] = [
  {
    slug: "price-action-daily-review",
    title: "Price Action Daily Review",
    titleZh: "价格行为每日复盘",
    description:
      "A daily review series for reading market structure, price action, and Al Brooks-inspired chart observations.",
    descriptionZh: "用于记录每日市场结构、价格行为和 Al Brooks 学习应用的复盘系列。",
    tags: ["Price Action", "Daily Review", "Al Brooks"],
    status: "active",
  },
  {
    slug: "ai-agent-workflow-lab",
    title: "AI Agent Workflow Lab",
    titleZh: "AI Agent 工作流实验室",
    description:
      "Small experiments, notes, and operating loops for Codex, ClaudeCode, local publishing, and agent workflows.",
    descriptionZh: "记录 Codex、ClaudeCode、本地发布流和 Agent 工作流的小实验与操作循环。",
    tags: ["AI", "Agent", "Workflow"],
    status: "active",
  },
  {
    slug: "myblog-engineering-log",
    title: "MyBlog Engineering Log",
    titleZh: "个人博客工程化日志",
    description:
      "Engineering notes for turning the Lovable prototype into a maintainable TanStack Start blog.",
    descriptionZh: "记录从 Lovable 原型到可维护 TanStack Start 博客的工程化过程。",
    tags: ["Blog", "Coding", "Product"],
    status: "building",
  },
  {
    slug: "materials-learning-notes",
    title: "Materials Learning Notes",
    titleZh: "材料学习笔记",
    description:
      "Reading notes, course notes, and long-term learning records for materials science and research preparation.",
    descriptionZh: "材料科学课程、论文阅读和长期学习准备的记录入口。",
    tags: ["Materials", "Research", "Learning"],
    status: "building",
  },
];
