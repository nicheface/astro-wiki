/**
 * LiveCodeBlock.tsx — In-Browser Code Sandbox
 *
 * Powered by Sandpack. Embed an editable, runnable code snippet
 * directly inside your MDX notes. Dark minimal theme, Apple-grade feel.
 */
"use client";

import { Sandpack } from "@codesandbox/sandpack-react";

// ----- Types -----
interface LiveCodeBlockProps {
  /** The code content (HTML + optional inline CSS/JS) */
  code: string;
  /** Optional title displayed above the sandbox */
  title?: string;
  /** Height of the preview panel in px */
  previewHeight?: number;
}

// ----- Apple-inspired custom theme -----
const appleDarkTheme = {
  colors: {
    surface1: "#1c1c1e",
    surface2: "#2c2c2e",
    surface3: "#3a3a3c",
    clickable: "#a1a1aa",
    base: "#f4f4f5",
    disabled: "#52525b",
    hover: "#e4e4e7",
    accent: "#3b82f6",
    error: "#ef4444",
    errorSurface: "#3b1e1e",
  },
  syntax: {
    plain: "#f4f4f5",
    comment: "#6b7280",
    keyword: "#c084fc",
    tag: "#60a5fa",
    punctuation: "#a1a1aa",
    definition: "#f9a8d4",
    property: "#93c5fd",
    static: "#f9a8d4",
    string: "#86efac",
  },
  font: {
    body: "-apple-system, BlinkMacSystemFont, 'SF Mono', 'Fira Code', monospace",
    mono: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
    size: "13px",
    lineHeight: "22px",
  },
};

// ----- Component -----
export default function LiveCodeBlock({
  code,
  title,
  previewHeight = 360,
}: LiveCodeBlockProps) {
  return (
    <div className="not-prose my-10">
      {title && (
        <h4 className="text-sm font-medium text-zinc-500 mb-4 tracking-wide">
          {title}
        </h4>
      )}

      <div className="rounded-2xl overflow-hidden border border-zinc-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <Sandpack
          template="static"
          files={{
            "/index.html": code,
          }}
          theme={appleDarkTheme}
          options={{
            showLineNumbers: true,
            showTabs: false,
            editorHeight: 200,
            editorWidthPercentage: 100,
          }}
        />
      </div>

      <p className="mt-3 text-xs text-zinc-400 text-center">
        可编辑代码沙盒 &mdash; 直接在浏览器中修改并运行
      </p>
    </div>
  );
}
