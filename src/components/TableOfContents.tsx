/**
 * TableOfContents.tsx — Sticky right sidebar TOC
 *
 * Scans the article DOM for h2/h3 headings and renders
 * a clickable table of contents with active-section highlighting.
 */
"use client";

import { useState, useEffect, useCallback } from "react";

// ----- Types -----
interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

// ----- Component -----
export default function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Collect headings from the DOM
  useEffect(() => {
    const article = document.querySelector("article.prose");
    if (!article) return;
    const headings = article.querySelectorAll("h2, h3");
    const toc: TocItem[] = [];
    headings.forEach((h) => {
      const id = h.id || h.textContent?.replace(/\s+/g, "-").toLowerCase() || "";
      toc.push({
        id,
        text: h.textContent || "",
        level: h.tagName === "H2" ? 2 : 3,
      });
    });
    setItems(toc);
  }, []);

  // Track which heading is in view
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <aside className="w-48 shrink-0 hidden xl:block">
      <nav className="sticky top-20 pl-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-4">
          目录
        </h4>

        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={`
                  block text-sm py-1 border-l-2 transition-all duration-200
                  ${item.level === 3 ? "pl-6" : "pl-3"}
                  ${activeId === item.id
                    ? "border-blue-500 text-blue-600 font-medium"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-300"
                  }
                `}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
