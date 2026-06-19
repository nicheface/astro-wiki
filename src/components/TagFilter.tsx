/**
 * TagFilter.tsx — Apple-inspired hierarchical tag filter
 *
 * Every tag (L1/L2/L3) is clickable and filters articles.
 * Hierarchy is visual organization only — filtering is flat AND-logic.
 */
"use client";

import { useState, useMemo } from "react";
import type { ArticleMeta } from "../data/articles";
import { ALL_TAGS, getLabel, getTopLevel, getL2WithChildren, getChildren } from "../data/tags";
import type { TagDef } from "../data/tags";

// ----- Types -----
interface TagFilterProps {
  articles: ArticleMeta[];
}

// ===== Sub: Tag Pill =====
function Pill({
  tag,
  active,
  count,
  onClick,
}: {
  tag: TagDef;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const sizeClass =
    tag.level === 1
      ? "text-sm px-3 py-1.5"
      : tag.level === 2
        ? "text-xs px-2.5 py-1"
        : "text-[11px] px-2 py-0.5";

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-lg font-medium
        transition-all duration-200 ease-out
        ${sizeClass}
        ${active
          ? "bg-blue-600 text-white shadow-[0_2px_8px_rgb(59,130,246,0.25)]"
          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
        }
      `}
    >
      {tag.label}
      {count > 0 && (
        <span className={`text-[10px] opacity-70`}>{count}</span>
      )}
    </button>
  );
}

// ===== Main =====
export default function TagFilter({ articles }: TagFilterProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Count how many articles carry each tag
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    articles.forEach((a) => a.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return m;
  }, [articles]);

  // AND filter: article must contain ALL selected tags
  const filtered = useMemo(() => {
    if (selected.size === 0) return articles;
    return articles.filter((a) => {
      const s = new Set(a.tags);
      return Array.from(selected).every((t) => s.has(t));
    });
  }, [articles, selected]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const clearAll = () => setSelected(new Set());

  const topLevel = getTopLevel();

  return (
    <div>
      {/* ========== Filter Panel ========== */}
      <div className="mb-12 rounded-2xl border border-zinc-100/60 bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            标签筛选
          </h3>
          {selected.size > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              清除
            </button>
          )}
        </div>

        {/* Active chips */}
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6 pb-6 border-b border-zinc-100">
            {Array.from(selected).map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
              >
                {getLabel(k)}
                <button onClick={() => toggle(k)} className="hover:text-blue-900 ml-0.5">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Hierarchy tree */}
        <div className="space-y-6">
          {topLevel.map((l1) => {
            const l2tags = getL2WithChildren(l1.key);
            if (l2tags.length === 0) return null;

            return (
              <div key={l1.key}>
                {/* Level 1 row */}
                <div className="flex items-center gap-3 mb-2">
                  <Pill
                    tag={l1}
                    active={selected.has(l1.key)}
                    count={tagCounts.get(l1.key) ?? 0}
                    onClick={() => toggle(l1.key)}
                  />
                  <div className="h-px flex-1 bg-zinc-100" />
                </div>

                {/* Level 2 + Level 3 */}
                <div className="ml-1 pl-4 border-l border-zinc-100 space-y-3">
                  {l2tags.map((l2) => {
                    const l3tags = getChildren(l2.key);
                    return (
                      <div key={l2.key}>
                        {/* Level 2 row */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <Pill
                            tag={l2}
                            active={selected.has(l2.key)}
                            count={tagCounts.get(l2.key) ?? 0}
                            onClick={() => toggle(l2.key)}
                          />
                        </div>

                        {/* Level 3 pills */}
                        {l3tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 ml-0">
                            {l3tags.map((l3) => (
                              <Pill
                                key={l3.key}
                                tag={l3}
                                active={selected.has(l3.key)}
                                count={tagCounts.get(l3.key) ?? 0}
                                onClick={() => toggle(l3.key)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== Article List ========== */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-8">
        {selected.size > 0 ? `筛选结果（${filtered.length}）` : `最新笔记（${filtered.length}）`}
      </h2>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-400 text-sm">没有匹配的笔记，试试减少筛选条件。</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="block group p-6 rounded-2xl transition-all duration-300 ease-out hover:bg-zinc-50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          selected.has(t)
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {getLabel(t)}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors duration-300">
                    {a.title}
                  </h3>
                  <p className="text-zinc-500 leading-relaxed">{a.description}</p>
                </div>
                <time className="shrink-0 text-sm text-zinc-400 mt-1" dateTime={a.date}>
                  {a.date}
                </time>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
