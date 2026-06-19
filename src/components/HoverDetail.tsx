/**
 * HoverDetail.jsx — Immersive Term Popover
 *
 * Wraps a term in inline text. On hover/click, reveals a glassmorphism
 * bubble with full explanation. Feels native, fluid, and delightful.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ----- Types -----
interface HoverDetailProps {
  /** The highlighted term shown in text */
  term: string;
  /** Detailed explanation (supports HTML / JSX) */
  children: React.ReactNode;
  /** Optional link for further reading */
  href?: string;
}

// ----- Hook: detect click outside -----
function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

// ----- Component -----
export default function HoverDetail({ term, children, href }: HoverDetailProps) {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setHovering(false);
  }, []);

  useClickOutside(bubbleRef, close);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovering(true);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHovering(false);
      // Keep open if the bubble itself is being hovered
      setOpen(false);
    }, 200);
  };

  const handleClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span className="relative inline" ref={containerRef}>
      {/* Trigger term */}
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-pointer text-blue-600 border-b border-blue-300 border-dashed pb-0.5 transition-all duration-300 ease-out hover:text-blue-500 hover:border-blue-400"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      >
        {term}
      </span>

      {/* Glassmorphism Bubble */}
      {open && (
        <div
          ref={bubbleRef}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setHovering(true);
          }}
          onMouseLeave={handleMouseLeave}
          className={`
            absolute left-0 bottom-full mb-3 z-50
            w-72 p-5
            rounded-2xl
            bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl
            border border-zinc-100/60 dark:border-slate-700/60
            shadow-[0_12px_40px_rgb(0,0,0,0.08)]
            transition-all duration-300 ease-out
            ${hovering || open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95"}
          `}
        >
          {/* Bubble arrow */}
          <div className="absolute left-6 -bottom-2 w-4 h-4 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border-r border-b border-zinc-100/60 dark:border-slate-700/60 rotate-45" />

          {/* Term header */}
          <p className="text-sm font-semibold text-zinc-900 dark:text-slate-200 mb-2">{term}</p>

          {/* Detail content */}
          <div className="text-sm text-zinc-600 dark:text-slate-400 leading-relaxed space-y-2">
            {children}
          </div>

          {/* Optional "Learn more" link */}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              了解更多 &rarr;
            </a>
          )}
        </div>
      )}
    </span>
  );
}
