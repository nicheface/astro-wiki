/**
 * tags.ts — Three-level tag hierarchy
 *
 * ALL levels are filterable — hierarchy is for visual organization only.
 * Articles can carry tags from any level.
 *
 * Structure:
 *   Level 1 (领域)    →  Level 2 (主题)      →  Level 3 (具体)
 *   编程               →  Python              →  Litestar, FastAPI, 异步, 高性能
 *                      →  前端                →  Astro, React, Tailwind CSS
 *                      →  Web                 →  ASGI, API, 框架, MDX
 *   生活               →  电影
 *   思考               →  知识管理            →  隐知
 *                      →  方法论              →  组件化
 */

export interface TagDef {
  key: string;
  label: string;
  level: 1 | 2 | 3;
  parent?: string; // key of parent tag
}

// ===== All Tags =====

export const ALL_TAGS: TagDef[] = [
  // ---- Level 1 ----
  { key: "coding", label: "编程", level: 1 },
  { key: "life", label: "生活", level: 1 },
  { key: "thinking", label: "思考", level: 1 },

  // ---- Level 2 (under 编程) ----
  { key: "python", label: "Python", level: 2, parent: "coding" },
  { key: "frontend", label: "前端", level: 2, parent: "coding" },
  { key: "webdev", label: "Web", level: 2, parent: "coding" },
  { key: "ai", label: "AI", level: 2, parent: "coding" },

  // ---- Level 2 (under 生活) ----
  { key: "movie", label: "电影", level: 2, parent: "life" },

  // ---- Level 2 (under 思考) ----
  { key: "knowledge", label: "知识管理", level: 2, parent: "thinking" },
  { key: "methodology", label: "方法论", level: 2, parent: "thinking" },

  // ---- Level 3 (under Python) ----
  { key: "litestar", label: "Litestar", level: 3, parent: "python" },
  { key: "fastapi", label: "FastAPI", level: 3, parent: "python" },
  { key: "async", label: "异步", level: 3, parent: "python" },
  { key: "perf", label: "高性能", level: 3, parent: "python" },

  // ---- Level 3 (under 前端) ----
  { key: "astro", label: "Astro", level: 3, parent: "frontend" },
  { key: "react", label: "React", level: 3, parent: "frontend" },
  { key: "tailwind", label: "Tailwind CSS", level: 3, parent: "frontend" },

  // ---- Level 3 (under Web) ----
  { key: "asgi", label: "ASGI", level: 3, parent: "webdev" },
  { key: "api", label: "API", level: 3, parent: "webdev" },
  { key: "framework", label: "框架", level: 3, parent: "webdev" },
  { key: "mdx", label: "MDX", level: 3, parent: "webdev" },

  // ---- Level 3 (under 知识管理) ----
  { key: "digital-garden", label: "隐知", level: 3, parent: "knowledge" },

  // ---- Level 3 (under 方法论) ----
  { key: "component", label: "组件化", level: 3, parent: "methodology" },
  { key: "problem-solving", label: "问题解决", level: 3, parent: "methodology" },
  { key: "probability", label: "概率论", level: 3, parent: "methodology" },
  { key: "statistics", label: "统计学", level: 3, parent: "methodology" },
  { key: "decision-making", label: "决策", level: 3, parent: "methodology" },

  // ---- Level 3 (under AI) ----
  { key: "agent", label: "Agent", level: 3, parent: "ai" },
  { key: "skill", label: "Skill", level: 3, parent: "ai" },
  { key: "tool", label: "工具", level: 3, parent: "ai" },
  { key: "ppt", label: "PPT", level: 3, parent: "ai" },
  { key: "design-tool", label: "设计工具", level: 3, parent: "ai" },
];

// ===== Lookup =====

const tagMap = new Map<string, TagDef>();
ALL_TAGS.forEach((t) => tagMap.set(t.key, t));

export function getTag(key: string): TagDef | undefined {
  return tagMap.get(key);
}

export function getLabel(key: string): string {
  return tagMap.get(key)?.label ?? key;
}

export function getLevel(key: string): 1 | 2 | 3 {
  return tagMap.get(key)?.level ?? 3;
}

export function getChildren(parentKey: string): TagDef[] {
  return ALL_TAGS.filter((t) => t.parent === parentKey);
}

export function isDescendant(tagKey: string, ancestorKey: string): boolean {
  let current = tagMap.get(tagKey);
  while (current?.parent) {
    if (current.parent === ancestorKey) return true;
    current = tagMap.get(current.parent);
  }
  return false;
}

/** All level-1 tags that have children */
export function getTopLevel(): TagDef[] {
  return ALL_TAGS.filter((t) => t.level === 1);
}

/** All level-2 tags under a given level-1 parent, that have level-3 children */
export function getL2WithChildren(l1Key: string): TagDef[] {
  return ALL_TAGS.filter(
    (t) => t.level === 2 && t.parent === l1Key && getChildren(t.key).length > 0
  );
}
