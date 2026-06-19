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
