/**
 * articles.ts — Centralized article registry
 */

export interface ArticleMeta {
  href: string;
  title: string;
  description: string;
  date: string;
  tags: string[]; // tag keys from tags.ts (any level)
}

export const articles: ArticleMeta[] = [
  {
    href: "/astro-wiki/06-probability-humility",
    title: "概率的谦卑：一个泊松模型教我的事",
    description:
      "从足球比分到人生决策，同一个数学结构在运作——泊松、校准、预注册。不是关于预测未来，是关于诚实面对不确定。",
    date: "2026-06-21",
    tags: ["thinking", "methodology", "probability", "statistics", "decision-making"],
  },
  {
    href: "/astro-wiki/05-markdown-vs-mdx",
    title: "Markdown vs MDX：什么时候该用哪个？",
    description:
      "一篇实战对比——MDX 不是更高级的 Markdown，而是让内容成为应用的一部分。附带四条决策原则和具体场景对照。",
    date: "2026-06-20",
    tags: ["thinking", "methodology", "mdx", "component"],
  },
  {
    href: "/astro-wiki/04-source-flow-system",
    title: "源流系统 —— 问题解决工作表",
    description:
      "一套结构化五步问题解决框架：破局→探底→锚心→造流→越迁。从情绪管理到系统升级，附可打印 A4 工作表。",
    date: "2026-06-20",
    tags: ["thinking", "methodology", "problem-solving"],
  },
  {
    href: "/astro-wiki/03-ai-agent-tools",
    title: "AI Agent 工具三则：Dokobot / Huashu Design / PPT Master",
    description:
      "三款 2026 年值得关注的 AI Agent 生态工具：让 AI 浏览真实网页、生成可交付设计稿、从文档一键出原生可编辑 PPT。",
    date: "2026-06-20",
    tags: ["coding", "ai", "agent", "tool", "skill", "design-tool", "ppt"],
  },
  {
    href: "/astro-wiki/02-litestar-python-web-framework",
    title: "Litestar：高性能 ASGI Python Web 框架",
    description:
      "异步优先、Rust 加速的 Python ASGI 框架——msgspec 序列化 + SQLAlchemy 深度集成，基准测试全面优于 FastAPI。",
    date: "2026-06-20",
    tags: ["coding", "python", "litestar", "asgi", "api", "framework", "async", "perf"],
  },
  {
    href: "/astro-wiki/01-future-of-knowledge",
    title: "知识的未来：从超链接到超级组件",
    description:
      "探索下一代知识库的可能性——当 Markdown 遇见 React 组件，笔记不再只是文字，而是一个可交互的数字花园。",
    date: "2026-06-20",
    tags: ["thinking", "knowledge", "digital-garden", "frontend", "astro", "react", "mdx", "component"],
  },
];
