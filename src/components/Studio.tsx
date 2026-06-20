/**
 * Studio.tsx — 个人 AI 工作室
 * Two tools: Article Generator + Content Q&A
 * Uses marked.js for proper markdown rendering.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { marked } from "marked";

// ----- Types -----
interface ArticleInfo {
  title: string;
  description: string;
  href: string;
  content: string;
}

interface StudioProps {
  articlesJson: string;
  writingGuide: string;
  apiKey: string;
}

// ============================================================
//  Main Component
// ============================================================

export default function Studio({ articlesJson, writingGuide, apiKey }: StudioProps) {
  const articles: ArticleInfo[] = JSON.parse(articlesJson);
  const [tab, setTab] = useState<"generate" | "qa">("qa");

  // ----- Article Generator state -----
  const [genTopic, setGenTopic] = useState("");
  const [genTags, setGenTags] = useState("");
  const [genDesc, setGenDesc] = useState("");
  const [genOutput, setGenOutput] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  // ----- Q&A state -----
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<{ title: string; href: string }[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState("");

  const genAbortRef = useRef<AbortController | null>(null);
  const qaAbortRef = useRef<AbortController | null>(null);

  // Debug: log articles on mount
  useEffect(() => {
    console.log("[Studio] Loaded articles:", articles.length);
    articles.forEach((a, i) => console.log(`  ${i + 1}. ${a.title} (${a.content.length} chars) → ${a.href}`));
  }, [articles]);

  // ============================================================
  //  Article Generator
  // ============================================================

  const generateArticle = async () => {
    if (!genTopic.trim() || genLoading) return;
    setGenLoading(true);
    setGenOutput("");
    setGenError("");

    const controller = new AbortController();
    genAbortRef.current = controller;

    const articleList = articles
      .map((a) => `- **${a.title}**: ${a.description}`)
      .join("\n");

    const systemPrompt = `你是 Digital Garden 的 AI 作者。请根据以下写作指南和用户输入，生成一篇完整的 MDX 格式笔记。

## 写作指南
${writingGuide}

## 现有文章结构（供参考格式）
${articleList}

## 重要规则
1. 输出必须是合法的 MDX，以 --- 开头的 frontmatter 开始
2. Frontmatter 必须包含: layout, title, description, currentHref (用 /astro-wiki/ 前缀), tags
3. layout 必须是 "../layouts/ArticleLayout.astro"
4. 正文中优先使用已有组件: DataChart, HoverDetail, SmartImageCard, LiveCodeBlock, SwotCard, StepFlow, ArticleTag
5. 不要包含 import 语句
6. 风格: 简洁、深邃、文艺，匹配数字花园的整体调性`;

    const userPrompt = `请生成一篇新笔记。
主题: ${genTopic}
标签: ${genTags || "thinking"}
简介: ${genDesc || genTopic}`;

    try {
      const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-v4-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
          max_tokens: 4096,
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
          setGenOutput(full);
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setGenError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setGenLoading(false);
      genAbortRef.current = null;
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(genOutput).then(() => {
      const btn = document.getElementById("copy-btn");
      if (btn) { btn.textContent = "已复制 ✓"; setTimeout(() => { btn.textContent = "复制 MDX"; }, 2000); }
    });
  };

  // ============================================================
  //  Content Q&A
  // ============================================================

  const askQuestion = async () => {
    if (!question.trim() || qaLoading) return;
    setQaLoading(true);
    setAnswer("");
    setSources([]);
    setQaError("");

    const controller = new AbortController();
    qaAbortRef.current = controller;

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
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

      // Extract source article titles from answer
      const found: { title: string; href: string }[] = [];
      for (const a of articles) {
        if (full.includes(a.title)) found.push({ title: a.title, href: a.href });
      }
      setSources(found);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setQaError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setQaLoading(false);
      qaAbortRef.current = null;
    }
  };

  // ============================================================
  //  Render
  // ============================================================

  return (
    <div className="not-prose">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-slate-100">
          Studio
        </h1>
        <p className="text-sm text-zinc-500 dark:text-slate-400 mt-1">
          AI 文章生成 & 知识库问答
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl bg-zinc-100 dark:bg-slate-800 w-fit">
        <button
          onClick={() => setTab("qa")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === "qa"
              ? "bg-white dark:bg-slate-700 text-zinc-900 dark:text-slate-100 shadow-sm"
              : "text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-300"
          }`}
        >
          💬 问答
        </button>
        <button
          onClick={() => setTab("generate")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === "generate"
              ? "bg-white dark:bg-slate-700 text-zinc-900 dark:text-slate-100 shadow-sm"
              : "text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-300"
          }`}
        >
          ✨ 生成文章
        </button>
      </div>

      {/* ============================================================ */}
      {/*  Q&A Tab                                                    */}
      {/* ============================================================ */}
      {tab === "qa" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300">
              向知识库提问
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askQuestion();
                }
              }}
              placeholder="例如：Python 中推荐哪个 web 框架？"
              rows={3}
              disabled={qaLoading}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={askQuestion}
                disabled={qaLoading || !question.trim()}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all"
              >
                {qaLoading ? "思考中..." : "提问"}
              </button>
              {qaLoading && (
                <button
                  onClick={() => qaAbortRef.current?.abort()}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  停止
                </button>
              )}
            </div>
          </div>

          {qaError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
              {qaError}
            </div>
          )}

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
                      <a
                        key={s.title}
                        href={s.href || "#"}
                        className="px-2 py-0.5 rounded-md text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:underline transition-all"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Article index summary */}
          <details className="text-xs text-zinc-400 dark:text-slate-500" open>
            <summary className="cursor-pointer hover:text-zinc-600 dark:hover:text-slate-300">
              📚 已索引 {articles.length} 篇文章
            </summary>
            <ul className="mt-2 space-y-1">
              {articles.map((a, i) => (
                <li key={i}>
                  · <a href={a.href || "#"} className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"><strong>{a.title}</strong></a>
                  <span className="ml-1 text-zinc-300 dark:text-slate-600">({a.content.length} 字)</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Article Generator                                          */}
      {/* ============================================================ */}
      {tab === "generate" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-1">主题 *</label>
              <input
                type="text"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="例如：Python web 框架对比"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-1">标签</label>
              <input
                type="text"
                value={genTags}
                onChange={(e) => setGenTags(e.target.value)}
                placeholder="例如：python, webdev, framework"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-1">简介</label>
            <input
              type="text"
              value={genDesc}
              onChange={(e) => setGenDesc(e.target.value)}
              placeholder="一句话描述这篇笔记"
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={generateArticle}
              disabled={genLoading || !genTopic.trim()}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all"
            >
              {genLoading ? "生成中..." : "✨ 生成文章"}
            </button>
            {genLoading && (
              <button
                onClick={() => genAbortRef.current?.abort()}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                停止
              </button>
            )}
          </div>

          {genError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
              {genError}
            </div>
          )}

          {genOutput && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-slate-400">生成结果</h3>
                <button
                  id="copy-btn"
                  onClick={copyOutput}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-slate-300 hover:bg-zinc-300 dark:hover:bg-slate-600 transition-all"
                >
                  复制 MDX
                </button>
              </div>
              <pre className="p-5 rounded-2xl bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800 text-xs text-zinc-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto">
                {genOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
