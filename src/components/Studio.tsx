/**
 * Studio.tsx — 个人知识库问答
 * Password-protected Q&A over all articles.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { marked } from "marked";

// SHA-256 of "[redacted]"
const PASSWORD_HASH = "c8e24b7a9b9e8c9f1e3a5c7d9b0a2f4e6d8c0b2a4f6e8d0c2b4a6f8e0d2c4";

interface ArticleInfo {
  title: string;
  description: string;
  href: string;
  content: string;
}

interface StudioProps {
  articlesJson: string;
  apiKey: string;
}

// ============================================================
//  Crypto — SHA-256 for password verification
// ============================================================

async function sha256(text: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================================
//  Main Component
// ============================================================

export default function Studio({ articlesJson, apiKey }: StudioProps) {
  const articles: ArticleInfo[] = JSON.parse(articlesJson);

  // ----- Password gate -----
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("studio_unlocked") === "1";
  });
  const [pwdInput, setPwdInput] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdChecking, setPwdChecking] = useState(false);
  const pwdRef = useRef<HTMLInputElement>(null);

  // Auto-focus password input
  useEffect(() => {
    if (!unlocked) setTimeout(() => pwdRef.current?.focus(), 100);
  }, [unlocked]);

  const tryUnlock = useCallback(async () => {
    setPwdChecking(true);
    setPwdError("");
    const hash = await sha256(pwdInput);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem("studio_unlocked", "1");
      setUnlocked(true);
    } else {
      setPwdError("密码错误");
      setPwdInput("");
      pwdRef.current?.focus();
    }
    setPwdChecking(false);
  }, [pwdInput]);

  // ----- Q&A state -----
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<{ title: string; href: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Debug
  useEffect(() => {
    if (unlocked) console.log("[Studio] Loaded:", articles.length, "articles");
  }, [unlocked]);

  // ============================================================
  //  Q&A
  // ============================================================

  const askQuestion = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    setSources([]);
    setError("");

    const controller = new AbortController();
    abortRef.current = controller;

    const articleContext = articles
      .map((a, i) => `### 文章${i + 1}: ${a.title}\n${a.description}\n\n${a.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `你是 Digital Garden 知识库的问答助手。以下是知识库中所有文章的全文内容。请根据这些内容回答用户的问题。

如果答案在文章中有明确依据，请引用文章标题。如果找不到相关信息，请诚实说明。

回答格式使用 Markdown，可以自由使用表格、列表、引用块等格式。

## 知识库内容
${articleContext}`;

    try {
      const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "deepseek-v4-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          stream: true,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`API 错误 (${resp.status}): ${err.slice(0, 200)}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try { full += JSON.parse(data).choices?.[0]?.delta?.content || ""; } catch {}
          setAnswer(full);
        }
      }

      const found: { title: string; href: string }[] = [];
      for (const a of articles) {
        if (full.includes(a.title)) found.push({ title: a.title, href: a.href });
      }
      setSources(found);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  // ============================================================
  //  Password gate screen
  // ============================================================

  if (!unlocked) {
    return (
      <div className="not-prose flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
              Studio
            </h1>
            <p className="text-sm text-zinc-500 dark:text-slate-400">
              输入密码以访问
            </p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); tryUnlock(); }}
            className="space-y-3"
          >
            <input
              ref={pwdRef}
              type="password"
              value={pwdInput}
              onChange={(e) => { setPwdInput(e.target.value); setPwdError(""); }}
              placeholder="密码"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl text-sm text-center bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {pwdError && (
              <p className="text-xs text-red-500 dark:text-red-400">{pwdError}</p>
            )}
            <button
              type="submit"
              disabled={pwdChecking || !pwdInput.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-slate-300 disabled:opacity-40 transition-all"
            >
              {pwdChecking ? "验证中..." : "进入"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================
  //  Main Q&A UI
  // ============================================================

  return (
    <div className="not-prose">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
            Studio
          </h1>
          <p className="text-sm text-zinc-500 dark:text-slate-400 mt-1">
            知识库问答
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("studio_unlocked");
            setUnlocked(false);
          }}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          锁定
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300">向知识库提问</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(); } }}
            placeholder="例如：Python 中推荐哪个 web 框架？"
            rows={3}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
          <div className="flex items-center gap-3">
            <button onClick={askQuestion} disabled={loading || !question.trim()} className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all">
              {loading ? "思考中..." : "提问"}
            </button>
            {loading && <button onClick={() => abortRef.current?.abort()} className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-slate-500 dark:hover:text-slate-300">停止</button>}
          </div>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}

        {answer && (
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-slate-400 mb-3">回答</h3>
            <div
              className="prose prose-sm prose-zinc dark:prose-invert max-w-none [&_table]:w-full [&_table]:border-collapse [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:border-b [&_th]:border-zinc-200 dark:[&_th]:border-slate-700 [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs [&_td]:border-b [&_td]:border-zinc-100 dark:[&_td]:border-slate-800 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:text-sm [&_blockquote]:text-zinc-500 dark:[&_blockquote]:text-slate-400 [&_hr]:my-4 [&_hr]:border-zinc-200 dark:[&_hr]:border-slate-700"
              dangerouslySetInnerHTML={{ __html: marked.parse(answer, { breaks: true }) as string }}
            />
            {sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-slate-800">
                <p className="text-xs text-zinc-400 dark:text-slate-500 mb-1">参考文章:</p>
                <div className="flex flex-wrap gap-1">
                  {sources.map((s) => (
                    <a key={s.title} href={s.href || "#"} className="px-2 py-0.5 rounded-md text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:underline transition-all">{s.title}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <details className="text-xs text-zinc-400 dark:text-slate-500" open>
          <summary className="cursor-pointer hover:text-zinc-600 dark:hover:text-slate-300">📚 已索引 {articles.length} 篇文章</summary>
          <ul className="mt-2 space-y-1">
            {articles.map((a, i) => (
              <li key={i}>· <a href={a.href || "#"} className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"><strong>{a.title}</strong></a><span className="ml-1 text-zinc-300 dark:text-slate-600">({a.content.length} 字)</span></li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
