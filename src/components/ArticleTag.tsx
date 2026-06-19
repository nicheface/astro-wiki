/**
 * ArticleTag.tsx — Inline tag with click-to-show related articles popover
 *
 * Used inside MDX articles. Clicking a tag shows a small popover
 * listing other articles that share the same tag.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getTagLabel } from "../data/tags";
import { articles } from "../data/articles";

// ----- Types -----
interface ArticleTagProps {
  tagKey: string;
}

// ----- Hook: click outside -----
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

// ----- Component -----
export default function ArticleTag({ tagKey }: ArticleTagProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const label = getTagLabel(tagKey);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(popoverRef, close);

  // Find related articles (share this tag, excluding the current page)
  const related = articles.filter((a) => a.tags.includes(tagKey));

  // On click, close if already open (toggle)
  const handleClick = () => setOpen((prev) => !prev);

  // Keyboard support
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
    if (e.key === "Escape") close();
  };

  return (
    <span className="relative inline">
      <span
        onClick={handleClick}
        onKeyDown={handleKey}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        className="cursor-pointer inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-xs font-medium text-zinc-500 transition-all duration-200 ease-out hover:bg-blue-50 hover:text-blue-600"
      >
        {label}
      </span>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          className={`
            absolute left-0 bottom-full mb-2 z-50
            w-64 p-4
            rounded-xl
            bg-white/90 backdrop-blur-xl
            border border-zinc-100/60
            shadow-[0_12px_40px_rgb(0,0,0,0.08)]
            transition-all duration-200 ease-out
          `}
        >
          {/* Arrow */}
          <div className="absolute left-4 -bottom-1.5 w-3 h-3 bg-white/90 backdrop-blur-xl border-r border-b border-zinc-100/60 rotate-45" />

          <p className="text-xs font-semibold text-zinc-900 mb-3">
            包含「{label}」的笔记
          </p>

          {related.length === 0 ? (
            <p className="text-xs text-zinc-400">暂无其他笔记</p>
          ) : (
            <div className="space-y-2">
              {related.map((article) => (
                <a
                  key={article.href}
                  href={article.href}
                  onClick={close}
                  className="block p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors duration-150 group/link"
                >
                  <p className="text-sm font-medium text-zinc-800 group-hover/link:text-blue-600 transition-colors line-clamp-1">
                    {article.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                    {article.description}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
