/**
 * TagFilter.tsx — Compact 3-row filter + expandable full-view popup
 *
 * Default: 3 rows (L1 / L2 / L3), compact and clean.
 * Popup: full hierarchical tree, triggered by "展开" button.
 * Every tag at every level is clickable for filtering.
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import type { ArticleMeta } from "../data/articles";
import { ALL_TAGS, getLabel, getTopLevel } from "../data/tags";
import type { TagDef } from "../data/tags";

// ----- Types -----
interface TagFilterProps {
  articles: ArticleMeta[];
}

// ===== Sub: small pill (compact rows) =====
function SmallPill({
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
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
        transition-all duration-200 ease-out whitespace-nowrap
        ${active
          ? "bg-blue-600 text-white shadow-[0_1px_4px_rgb(59,130,246,0.2)]"
          : "bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400 hover:bg-zinc-200 dark:hover:bg-slate-700 hover:text-zinc-700 dark:hover:text-slate-300"
        }
      `}
    >
      {tag.label}
      {count > 0 && <span className="opacity-60 text-[10px]">{count}</span>}
    </button>
  );
}

// ===== Main =====
export default function TagFilter({ articles }: TagFilterProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    articles.forEach((a) => a.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return m;
  }, [articles]);

  const filtered = useMemo(() => {
    if (selected.size === 0) return articles;
    return articles.filter((a) => {
      const s = new Set(a.tags);
      return Array.from(selected).every((t) => s.has(t));
    });
  }, [articles, selected]);

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const clearAll = () => setSelected(new Set());

  // Unified data: only show tags that have articles
  const visibleL1 = useMemo(
    () => getTopLevel().filter((t) => (tagCounts.get(t.key) ?? 0) > 0),
    [tagCounts]
  );
  const visibleL2 = useMemo(
    () => ALL_TAGS.filter((t) => t.level === 2 && (tagCounts.get(t.key) ?? 0) > 0),
    [tagCounts]
  );
  const visibleL3 = useMemo(
    () => ALL_TAGS.filter((t) => t.level === 3 && (tagCounts.get(t.key) ?? 0) > 0),
    [tagCounts]
  );

  return (
    <div>
      {/* ============ Compact Filter Bar ============ */}
      <div className="mb-10 rounded-2xl border border-zinc-100/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        {/* Header */}
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            标签筛选
          </h3>
        </div>

        {/* Selected chips */}
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Array.from(selected).map((k) => (
              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium">
                {getLabel(k)}
                <button onClick={() => toggle(k)} className="hover:text-blue-900">×</button>
              </span>
            ))}
            <button onClick={clearAll} className="text-[11px] text-zinc-400 hover:text-zinc-600 ml-1">
              清除
            </button>
          </div>
        )}

        {/* Row 1: Level 1 */}
        <div className="flex items-start gap-1.5 mb-2 flex-wrap">
          <span className="text-[10px] text-zinc-400 shrink-0 mt-1.5 w-6">一级</span>
          {visibleL1.map((t) => (
            <SmallPill
              key={t.key}
              tag={t}
              active={selected.has(t.key)}
              count={tagCounts.get(t.key) ?? 0}
              onClick={() => toggle(t.key)}
            />
          ))}
        </div>

        {/* Row 2: Level 2 */}
        <div className="flex items-start gap-1.5 mb-2 flex-wrap">
          <span className="text-[10px] text-zinc-400 shrink-0 mt-1.5 w-6">二级</span>
          {visibleL2.map((t) => (
            <SmallPill
              key={t.key}
              tag={t}
              active={selected.has(t.key)}
              count={tagCounts.get(t.key) ?? 0}
              onClick={() => toggle(t.key)}
            />
          ))}
        </div>

        {/* Row 3: Level 3 */}
        <div className="flex items-start gap-1.5 flex-wrap">
          <span className="text-[10px] text-zinc-400 shrink-0 mt-1.5 w-6">三级</span>
          {visibleL3.length > 0 ? (
            visibleL3.map((t) => (
              <SmallPill
                key={t.key}
                tag={t}
                active={selected.has(t.key)}
                count={tagCounts.get(t.key) ?? 0}
                onClick={() => toggle(t.key)}
              />
            ))
          ) : (
            <span className="text-[11px] text-zinc-300">暂无</span>
          )}
        </div>
      </div>

      {/* ============ Article List ============ */}
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
              className="block group p-6 rounded-2xl transition-all duration-300 ease-out hover:bg-zinc-50 dark:hover:bg-slate-800/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          selected.has(t) ? "bg-blue-100 text-blue-700" : "bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400"
                        }`}
                      >
                        {getLabel(t)}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
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
