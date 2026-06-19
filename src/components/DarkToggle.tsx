/**
 * DarkToggle.tsx — iOS-style Light / Dark mode slider
 *
 * Persists preference to localStorage, defaults to system preference.
 */
"use client";

import { useState, useEffect, useCallback } from "react";

export default function DarkToggle() {
  const [dark, setDark] = useState(false);

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
      className="relative inline-flex items-center shrink-0 cursor-pointer"
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
    >
      {/* Track */}
      <span
        className={`
          block w-10 h-6 rounded-full transition-colors duration-300 ease-out
          ${dark ? "bg-blue-600" : "bg-zinc-300 dark:bg-slate-600"}
        `}
      />
      {/* Thumb */}
      <span
        className={`
          absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgb(0,0,0,0.15)]
          transition-all duration-300 ease-out flex items-center justify-center
          ${dark ? "left-[18px]" : "left-[2px]"}
        `}
      >
        {dark ? (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" fill="#3b82f6" />
            <path d="M8 2a6 6 0 000 12V2z" fill="#3b82f6" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" fill="#f59e0b" />
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
