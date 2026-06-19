/**
 * SearchBox.tsx — Pagefind-powered full-text search
 *
 * Two variants:
 *   "button" — nav bar: click icon → modal overlay
 *   "inline" — article body: persistent input → dropdown results
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ----- Types -----
interface SearchResult {
  url: string;
  title: string;
  excerpt: string;
}

interface SearchBoxProps {
  variant?: "button" | "inline";
}

// ===== Sub: Search Logic Hook =====
function usePagefindSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagefind, setPagefind] = useState<any>(null);

  const init = useCallback(async () => {
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

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const pf = pagefind || (await init());
      if (!pf) { setLoading(false); return; }
      try {
        const search = await pf.search(query.trim());
        const items = await Promise.all(
          (search?.results ?? []).slice(0, 8).map(async (r: any) => {
            const d = await r.data();
            return {
              url: d.url,
              title: d.meta?.title || d.url,
              excerpt: d.excerpt || "",
            };
          })
        );
        setResults(items);
      } catch { setResults([]); }
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, pagefind, init]);

  return { query, setQuery, results, loading, init };
}

// ===== Variant: Button → Modal (nav) =====
function ButtonSearch() {
  const [open, setOpen] = useState(false);
  const { query, setQuery, results, loading, init } = usePagefindSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 100); init(); }
    else { setQuery(""); }
  }, [open, init, setQuery]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-700 transition-colors duration-300"
        aria-label="搜索">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>
        </svg>
        <span className="hidden sm:inline">搜索</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh]"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.4)] border border-zinc-200/60 dark:border-slate-700/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <SearchInput query={query} setQuery={setQuery} loading={loading} onClose={() => setOpen(false)} inputRef={inputRef} />
            <SearchResults query={query} results={results} loading={loading} onSelect={() => setOpen(false)} />
            <SearchFooter />
          </div>
        </div>
      )}
    </>
  );
}

// ===== Variant: Inline input (article body) =====
function InlineSearch() {
  const { query, setQuery, results, loading, init } = usePagefindSearch();
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-slate-900 border border-zinc-200/60 dark:border-slate-700/60 transition-all duration-200 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-300 dark:focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgb(59,130,246,0.08)]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 shrink-0">
          <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>
        </svg>
        <input ref={inputRef} type="text" value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="搜索所有笔记..."
          className="flex-1 text-sm text-zinc-900 dark:text-slate-200 placeholder-zinc-400 dark:placeholder-slate-500 outline-none bg-transparent" />
        {loading && <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin shrink-0" />}
      </div>

      {focused && query.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200/60 dark:border-slate-700/60 shadow-[0_12px_40px_rgb(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.3)] overflow-hidden z-50">
          <SearchResults query={query} results={results} loading={loading} onSelect={() => setFocused(false)} />
        </div>
      )}
    </div>
  );
}

// ===== Shared: Search Input =====
function SearchInput({ query, setQuery, loading, onClose, inputRef }: {
  query: string; setQuery: (v: string) => void; loading: boolean;
  onClose: () => void; inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-slate-800">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 dark:text-slate-500 shrink-0">
        <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>
      </svg>
      <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索笔记..." className="flex-1 text-base text-zinc-900 dark:text-slate-200 placeholder-zinc-400 dark:placeholder-slate-500 outline-none bg-transparent" />
      {loading && <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin shrink-0" />}
      <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg>
      </button>
    </div>
  );
}

// ===== Shared: Results =====
function SearchResults({ query, results, loading, onSelect }: {
  query: string; results: SearchResult[]; loading: boolean; onSelect: () => void;
}) {
  if (!query.trim()) return null;
  if (loading && results.length === 0) return null;
  if (results.length === 0) {
    return <div className="px-5 py-12 text-center text-sm text-zinc-400 dark:text-slate-500">未找到相关笔记</div>;
  }
  return (
    <div className="py-2 max-h-[50vh] overflow-y-auto">
      {results.map((r) => (
        <a key={r.url} href={r.url} onClick={onSelect}
          className="block px-5 py-3 hover:bg-zinc-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
          <p className="text-sm font-medium text-zinc-900 dark:text-slate-200 line-clamp-1">{r.title}</p>
          {r.excerpt && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: r.excerpt }} />
          )}
        </a>
      ))}
    </div>
  );
}

// ===== Shared: Footer =====
function SearchFooter() {
  return (
    <div className="px-5 py-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
      <span>Pagefind 全文搜索</span>
      <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">Esc</kbd> 关闭</span>
    </div>
  );
}

// ===== Main Export =====
export default function SearchBox({ variant = "button" }: SearchBoxProps) {
  return variant === "inline" ? <InlineSearch /> : <ButtonSearch />;
}
