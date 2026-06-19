/**
 * SearchBox.tsx — Pagefind-powered full-text search
 *
 * Apple-style: click search icon → overlay with input → live results.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ----- Types -----
interface SearchResult {
  url: string;
  title: string;
  excerpt: string;
}

// ----- Component -----
export default function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagefind, setPagefind] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy-load Pagefind on first open
  const initPagefind = useCallback(async () => {
    if (pagefind) return pagefind;
    try {
      const pf = await import(
        /* @vite-ignore */
        "/astro-wiki/pagefind/pagefind.js"
      );
      setPagefind(pf);
      return pf;
    } catch {
      return null;
    }
  }, [pagefind]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      initPagefind();
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open, initPagefind]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !pagefind) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const search = await pagefind.search(query.trim());
        const items = await Promise.all(
          (search?.results ?? []).slice(0, 8).map(async (r: any) => {
            const data = await r.data();
            return {
              url: data.url,
              title: data.meta?.title || data.url,
              excerpt: data.excerpt || "",
            };
          })
        );
        setResults(items);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, pagefind]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-all duration-300 ease-out hover:text-zinc-700"
        aria-label="搜索"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
        <span className="hidden sm:inline">搜索</span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh]"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            ref={containerRef}
            className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] border border-zinc-200/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 shrink-0">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索笔记..."
                className="flex-1 text-base text-zinc-900 placeholder-zinc-400 outline-none bg-transparent"
              />
              {loading && (
                <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin shrink-0" />
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {query.trim() && results.length === 0 && !loading && (
                <div className="px-5 py-12 text-center text-sm text-zinc-400">
                  未找到相关笔记
                </div>
              )}
              {results.length > 0 && (
                <div className="py-2">
                  {results.map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      onClick={() => setOpen(false)}
                      className="block px-5 py-3 hover:bg-zinc-50 transition-colors duration-150"
                    >
                      <p className="text-sm font-medium text-zinc-900 line-clamp-1">
                        {r.title}
                      </p>
                      {r.excerpt && (
                        <p
                          className="text-xs text-zinc-500 mt-0.5 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: r.excerpt }}
                        />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
              <span>Pagefind 全文搜索</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">Esc</kbd> 关闭</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
