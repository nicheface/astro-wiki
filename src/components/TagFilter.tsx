/**
 * TagFilter.tsx — Interactive tag-based article filter
 *
 * Renders a list of clickable tag pills that filter articles in real-time.
 * Selecting multiple tags shows only articles containing ALL selected tags.
 */
"use client";

import { useState, useMemo } from "react";

// ----- Types -----
interface Article {
  href: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

interface TagFilterProps {
  articles: Article[];
}

// ----- Component -----
export default function TagFilter({ articles }: TagFilterProps) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Collect all unique tags from all articles, sorted alphabetically
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [articles]);

  // Filter articles: show all if no tags selected, otherwise require ALL selected tags
  const filtered = useMemo(() => {
    if (selectedTags.size === 0) return articles;
    return articles.filter((a) => {
      const articleTagSet = new Set(a.tags);
      return Array.from(selectedTags).every((t) => articleTagSet.has(t));
    });
  }, [articles, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const clearTags = () => setSelectedTags(new Set());

  return (
    <div>
      {/* Tag Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {allTags.map((tag) => {
          const active = selectedTags.has(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ease-out
                ${active
                  ? "bg-blue-600 text-white shadow-[0_2px_8px_rgb(59,130,246,0.25)]"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
                }
              `}
            >
              {tag}
            </button>
          );
        })}
        {selectedTags.size > 0 && (
          <button
            onClick={clearTags}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors duration-200"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Article List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-zinc-400 text-sm">
            没有匹配的笔记。试试减少筛选条件。
          </p>
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
                  {/* Mini tag preview */}
                  <div className="flex items-center gap-1.5 mb-1">
                    {article.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className={`
                          text-xs font-medium px-2 py-0.5 rounded
                          ${selectedTags.has(t)
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-500"
                          }
                        `}
                      >
                        {t}
                      </span>
                    ))}
                    {article.tags.length > 4 && (
                      <span className="text-xs text-zinc-400">+{article.tags.length - 4}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors duration-300">
                    {article.title}
                  </h3>
                  <p className="text-zinc-500 leading-relaxed">
                    {article.description}
                  </p>
                </div>
                <time
                  className="shrink-0 text-sm text-zinc-400 mt-1"
                  dateTime={article.date}
                >
                  {article.date}
                </time>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Count badge */}
      <p className="mt-6 text-xs text-zinc-400">
        {selectedTags.size > 0
          ? `筛选到 ${filtered.length} 篇笔记`
          : `共 ${articles.length} 篇笔记`}
      </p>
    </div>
  );
}
