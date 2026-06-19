/**
 * DarkToggle.tsx — Light / Dark mode toggle
 *
 * Persists preference to localStorage, defaults to system preference.
 */
"use client";

import { useState, useEffect, useCallback } from "react";

// ----- Component -----
export default function DarkToggle() {
  const [dark, setDark] = useState(false);

  // On mount, read saved preference or system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-300"
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a.75.75 0 01.75.75v1a.75.75 0 01-1.5 0v-1A.75.75 0 018 1zm4.95 2.3a.75.75 0 010 1.06l-.7.7a.75.75 0 11-1.06-1.06l.7-.7a.75.75 0 011.06 0zM15 8a.75.75 0 01-.75.75h-1a.75.75 0 010-1.5h1A.75.75 0 0115 8zm-2.05 4.7a.75.75 0 010-1.06l.7-.7a.75.75 0 11-1.06-1.06l-.7.7a.75.75 0 011.06 1.06zM8 15a.75.75 0 01-.75-.75v-1a.75.75 0 011.5 0v1A.75.75 0 018 15zm-4.95-2.3a.75.75 0 010-1.06l.7-.7a.75.75 0 011.06 1.06l-.7.7a.75.75 0 01-1.06 0zM1 8a.75.75 0 01.75-.75h1a.75.75 0 010 1.5h-1A.75.75 0 011 8zm2.3-4.95a.75.75 0 010 1.06l-.7.7a.75.75 0 11-1.06-1.06l.7-.7a.75.75 0 011.06 0zM8 4a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.914.344A.75.75 0 007.5.5v.95A6.004 6.004 0 0115 8a6 6 0 01-7.426 5.795A.75.75 0 007.5 13.5v-.95a6.004 6.004 0 01-7.426-5.795A.75.75 0 01.5 7.5h.95A6.004 6.004 0 0115 8a6 6 0 01-7.426 5.795A.75.75 0 017.5 13.5v-.95A6.004 6.004 0 01.074 8.795.75.75 0 01.5 7.5h.95A6.004 6.004 0 0115 8z" />
        </svg>
      )}
    </button>
  );
}
