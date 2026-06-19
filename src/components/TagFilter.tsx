/**
 * TagFilter.tsx — Hierarchical tag filter with collapsible sections
 *
 * Features:
 * - Three-level tag hierarchy (collapsible)
 * - Multi-select with AND logic
 * - Compact design for many tags
 * - Separate filter area (not inside article list)
 */
"use client";

import { useState, useMemo } from "react";
import type { ArticleMeta } from "../data/articles";
import {
  LEVEL_1_TAGS,
  LEVEL_2_TAGS,
  LEVEL_3_TAGS,
  getTagLabel,
  getChildren,
} from "../data/tags";
import type { TagDef } from "../data/tags";

// ----- Types -----
interface TagFilterProps {
  articles: ArticleMeta[];
}

// ----- Sub-component: Collapsible Section -----
function TagSection({
  tag,
  children,
  defaultOpen = false,
}: {
  tag: TagDef;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full text-left py-1.5 group"
      >
        <svg
          className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-700 transition-colors">
          {tag.label}
        </span>
        <span className="text-[10px] text-zinc-300 ml-auto">
          {tag.level === 1 ? "领域" : tag.level === 2 ? "主题" : ""}
        </span>
      </button>
      {open && <div className="ml-4 mt-1 space-y-1">{children}</div>}
    </div>
  );
}

// ----- Sub-component: Tag Pill -----
function TagPill({
  tagKey,
  active,
  onClick,
  count,
}: {
  tagKey: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
        transition-all duration-200 ease-out
        ${active
          ? "bg-blue-600 text-white shadow-[0_2px_6px_rgb(59,130,246,0.2)]"
          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
        }
      `}
    >
      {getTagLabel(tagKey)}
      <span className={`text-[10px] ${active ? "text-blue-200" : "text-zinc-400"}`}>
        {count}
      </span>
    </button>
  );
}

// ----- Main Component -----
export default function TagFilter({ articles }: TagFilterProps) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Count articles per tag
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    articles.forEach((a) => {
      a.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
    });
    return counts;
  }, [articles]);

  // Filter articles: show all if none selected, AND logic otherwise
  const filtered = useMemo(() => {
    if (selectedTags.size === 0) return articles;
    return articles.filter((a) => {
      const set = new Set(a.tags);
      return Array.from(selectedTags).every((t) => set.has(t));
    });
  }, [articles, selectedTags]);

  const toggleTag = (key: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const clearAll = () => setSelectedTags(new Set());

  // Find which Level 2 sections to expand (if any of their L3 children are selected)
  const l2HasActiveChild = (l2Key: string) => {
    return getChildren(l2Key).some((t) => selectedTags.has(t.key));
  };

  return (
    <div>
      {/* ===== Filter Panel ===== */}
      <div className="mb-10 p-6 rounded-2xl bg-zinc-50/50 border border-zinc-100/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            按领域筛选
          </h3>
          {selectedTags.size > 0 && (
            <button
              onClick={clearAll}
              className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              清除全部
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {selectedTags.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5 pb-5 border-b border-zinc-200/60">
            {Array.from(selectedTags).map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
              >
                {getTagLabel(key)}
                <button
                  onClick={() => toggleTag(key)}
                  className="ml-0.5 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Hierarchical tag tree */}
        <div className="space-y-3">
          {LEVEL_1_TAGS.map((l1) => {
            const l2Children = LEVEL_2_TAGS.filter((t) => t.parent === l1.key);
            if (l2Children.length === 0) return null;
            return (
              <TagSection key={l1.key} tag={l1} defaultOpen>
                {l2Children.map((l2) => {
                  const l3Children = LEVEL_3_TAGS.filter(
                    (t) => t.parent === l2.key && tagCounts.has(t.key)
                  );
                  if (l3Children.length === 0) return null;
                  return (
                    <TagSection
                      key={l2.key}
                      tag={l2}
                      defaultOpen={l2HasActiveChild(l2.key)}
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {l3Children.map((l3) => (
                          <TagPill
                            key={l3.key}
                            tagKey={l3.key}
                            active={selectedTags.has(l3.key)}
                            onClick={() => toggleTag(l3.key)}
                            count={tagCounts.get(l3.key) ?? 0}
                          />
                        ))}
                      </div>
                    </TagSection>
                  );
                })}
              </TagSection>
            );
          })}
        </div>
      </div>

      {/* ===== Article List ===== */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-8">
        {selectedTags.size > 0 ? `筛选结果（${filtered.length}）` : `最新笔记（${filtered.length}）`}
      </h2>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-400 text-sm">没有匹配的笔记，试试减少筛选条件。</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((article) => (
            <a
              key={article.href}
              href={article.href}
              className="block group p-6 rounded-2xl transition-all duration-300 ease-out hover:bg-zinc-50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {article.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          selectedTags.has(t)
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {getTagLabel(t)}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors duration-300">
                    {article.title}
                  </h3>
                  <p className="text-zinc-500 leading-relaxed">{article.description}</p>
                </div>
                <time className="shrink-0 text-sm text-zinc-400 mt-1" dateTime={article.date}>
                  {article.date}
                </time>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
