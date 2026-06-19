/**
 * LiveCodeBlock.tsx — Self-contained Code Sandbox
 *
 * Zero external dependencies. Uses textarea + iframe srcdoc to run
 * HTML/CSS/JS entirely in-browser. Works offline, no network needed.
 */
"use client";

import { useState, useRef, useCallback } from "react";

// ----- Types -----
interface LiveCodeBlockProps {
  code: string;
  title?: string;
  previewHeight?: number;
}

// ----- Component -----
export default function LiveCodeBlock({
  code,
  title,
  previewHeight = 340,
}: LiveCodeBlockProps) {
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState(code);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update the iframe preview whenever source changes
  const updatePreview = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(source);
        doc.close();
      }
    }
  }, [source]);

  // Update preview when source changes
  const handleRun = () => updatePreview();

  // Initial preview on mount is handled by srcdoc via srcDoc attribute

  return (
    <div className="not-prose my-10">
      {title && (
        <h4 className="text-sm font-medium text-zinc-500 dark:text-slate-400 mb-4 tracking-wide">
          {title}
        </h4>
      )}

      <div className="rounded-2xl overflow-hidden border border-zinc-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className={`
                px-3 py-1 text-xs font-medium rounded-md transition-all duration-200
                ${editing
                  ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                  : "bg-blue-600 text-white hover:bg-blue-500"
                }
              `}
            >
              {editing ? "预览" : "编辑"}
            </button>
            <button
              onClick={handleRun}
              className="px-3 py-1 text-xs font-medium rounded-md bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-all duration-200"
            >
              运行
            </button>
          </div>
        </div>

        {/* Editor */}
        {editing && (
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            className="w-full bg-zinc-900 text-zinc-200 font-mono text-sm leading-relaxed p-5 outline-none resize-none border-0"
            style={{ height: 200, tabSize: 2 }}
            placeholder="输入 HTML/CSS/JS 代码..."
          />
        )}

        {/* Preview */}
        <div
          className="bg-white"
          style={{ height: editing ? previewHeight : previewHeight + 200 }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={source}
            title="代码预览"
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0"
            style={{ backgroundColor: "#fff" }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-400 text-center">
        可编辑代码沙盒 &mdash; 点击「编辑」修改代码，点击「运行」查看效果
      </p>
    </div>
  );
}
