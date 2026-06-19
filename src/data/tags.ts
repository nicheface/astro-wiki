/**
 * tags.ts — Centralized tag hierarchy registry
 *
 * Three-level tag system:
 *   Level 1 — broad categories (domains)
 *   Level 2 — sub-categories (topics)
 *   Level 3 — specific technologies / concepts
 *
 * When adding a new tag, put it under the correct parent.
 * Tags not assigned to any Level 2 parent will appear as "未分类" at Level 2.
 */

export interface TagDef {
  key: string;
  label: string;
  level: 1 | 2 | 3;
  /** Parent tag key (only for level 2 and 3) */
  parent?: string;
}

// ===== Level 1 — Domains =====

export const LEVEL_1_TAGS: TagDef[] = [
  { key: "tech", label: "技术", level: 1 },
  { key: "design", label: "设计", level: 1 },
  { key: "thought", label: "思想", level: 1 },
];

// ===== Level 2 — Sub-categories =====

export const LEVEL_2_TAGS: TagDef[] = [
  // --- under 技术 ---
  { key: "web", label: "Web 开发", level: 2, parent: "tech" },
  { key: "python", label: "Python", level: 2, parent: "tech" },
  { key: "frontend", label: "前端", level: 2, parent: "tech" },
  { key: "backend", label: "后端", level: 2, parent: "tech" },
  { key: "devops", label: "DevOps", level: 2, parent: "tech" },

  // --- under 设计 ---
  { key: "ui-ux", label: "UI/UX", level: 2, parent: "design" },
  { key: "visual", label: "视觉设计", level: 2, parent: "design" },

  // --- under 思想 ---
  { key: "methodology", label: "方法论", level: 2, parent: "thought" },
  { key: "knowledge-mgmt", label: "知识管理", level: 2, parent: "thought" },
];

// ===== Level 3 — Specific tags (these appear on articles) =====

export const LEVEL_3_TAGS: TagDef[] = [
  // --- under Web 开发 ---
  { key: "astro", label: "Astro", level: 3, parent: "web" },
  { key: "react", label: "React", level: 3, parent: "web" },
  { key: "mdx", label: "MDX", level: 3, parent: "web" },
  { key: "api", label: "API", level: 3, parent: "web" },
  { key: "framework", label: "框架", level: 3, parent: "web" },

  // --- under Python ---
  { key: "litestar", label: "Litestar", level: 3, parent: "python" },
  { key: "fastapi", label: "FastAPI", level: 3, parent: "python" },
  { key: "asgi", label: "ASGI", level: 3, parent: "python" },
  { key: "async", label: "异步", level: 3, parent: "python" },
  { key: "performance", label: "高性能", level: 3, parent: "python" },

  // --- under 前端 ---
  { key: "tailwind", label: "Tailwind CSS", level: 3, parent: "frontend" },
  { key: "component", label: "组件化", level: 3, parent: "frontend" },

  // --- under 思想/方法论 ---
  { key: "digital-garden", label: "数字花园", level: 3, parent: "methodology" },
];

// ===== Lookup helpers =====

const ALL_TAGS = [...LEVEL_1_TAGS, ...LEVEL_2_TAGS, ...LEVEL_3_TAGS];

const tagMap = new Map<string, TagDef>();
ALL_TAGS.forEach((t) => tagMap.set(t.key, t));

export function getTag(key: string): TagDef | undefined {
  return tagMap.get(key);
}

export function getTagLabel(key: string): string {
  return tagMap.get(key)?.label ?? key;
}

export function getTagLevel(key: string): 1 | 2 | 3 {
  return tagMap.get(key)?.level ?? 3;
}

export function getTagParent(key: string): string | undefined {
  return tagMap.get(key)?.parent;
}

/** Get the full hierarchy path for a tag: [L1 key, L2 key, L3 key?] */
export function getTagPath(key: string): string[] {
  const tag = tagMap.get(key);
  if (!tag) return [key];
  if (tag.level === 1) return [key];
  if (tag.level === 2) {
    return [tag.parent!, key];
  }
  // level 3
  const l2 = tag.parent!;
  const l2Tag = tagMap.get(l2);
  const l1 = l2Tag?.parent!;
  return [l1, l2, key];
}

/** Get all children of a given parent tag key */
export function getChildren(parentKey: string): TagDef[] {
  return ALL_TAGS.filter((t) => t.parent === parentKey);
}

export function getAllTags(): TagDef[] {
  return ALL_TAGS;
}
