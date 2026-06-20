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
  const [tab, setTab] = useState<"generate" | "qa" | "manage">("qa");

  // ----- Article Generator state -----
  const [genPrompt, setGenPrompt] = useState("");
  const [genOutput, setGenOutput] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  // ----- Q&A state -----
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<{ title: string; href: string }[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState("");

  // ----- Manage Notes state -----
  const [manageIdx, setManageIdx] = useState(-1);
  const [manageInstruction, setManageInstruction] = useState("");
  const [manageOutput, setManageOutput] = useState("");
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState("");

  const genAbortRef = useRef<AbortController | null>(null);
  const qaAbortRef = useRef<AbortController | null>(null);
  const manageAbortRef = useRef<AbortController | null>(null);

  // Debug: log articles on mount
  useEffect(() => {
    console.log("[Studio] Loaded articles:", articles.length);
    articles.forEach((a, i) => console.log(`  ${i + 1}. ${a.title} (${a.content.length} chars) → ${a.href}`));
  }, [articles]);

  // ============================================================
  //  Article Generator
  // ============================================================

  const generateArticle = async () => {
    if (!genPrompt.trim() || genLoading) return;
    setGenLoading(true);
    setGenOutput("");
    setGenError("");

    const controller = new AbortController();
    genAbortRef.current = controller;

    const articleList = articles
      .map((a) => `- **${a.title}**: ${a.description}`)
      .join("\n");

    const systemPrompt = `你是 Digital Garden 的 AI 作者。请根据以下写作指南和用户描述，生成一篇完整的 MDX 格式笔记。

## 写作指南
${writingGuide}

## 现有文章结构（供参考格式）
${articleList}

## 重要规则
1. 输出必须是合法的 MDX，以 --- 开头的 frontmatter 开始
2. Frontmatter 必须包含: layout, title, description, currentHref, tags —— 全部由你根据内容自动生成
3. currentHref 使用 "/astro-wiki/XX-slug" 格式，slug 由你从标题自动推导
4. layout 必须是 "../layouts/ArticleLayout.astro"
5. tags 从已有的标签层级中选择（coding/life/thinking 及其子标签），如需要也可建议新标签
6. 正文中优先使用已有组件: DataChart, HoverDetail, SmartImageCard, LiveCodeBlock, SwotCard, StepFlow, ArticleTag
7. 不要包含 import 语句
8. 风格: 简洁、深邃、文艺，匹配数字花园的整体调性`;

    const userPrompt = genPrompt;

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
  //  Manage Notes — AI Rewrite
  // ============================================================

  const selectedArticle = articles[manageIdx] || null;

  const rewriteArticle = async () => {
    if (!selectedArticle || !manageInstruction.trim() || manageLoading) return;
    setManageLoading(true);
    setManageOutput("");
    setManageError("");

    const controller = new AbortController();
    manageAbortRef.current = controller;

    const systemPrompt = `你是 Digital Garden 的编辑。用户想修改知识库中的一篇文章。请根据用户的修改指令，输出修改后的完整 MDX 文件。

## 原始文章
标题: ${selectedArticle.title}
${selectedArticle.content}

## 规则
1. 输出修改后的完整 MDX，包含 frontmatter
2. 保持 frontmatter 中的 layout、currentHref 不变
3. 如果用户要求修改标题/描述/标签，相应更新 frontmatter
4. 如果用户只是局部修改，保留未提及的部分不变
5. 不要包含 import 语句`;

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
            { role: "user", content: manageInstruction },
          ],
          stream: true,
          max_tokens: 8192,
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
          setManageOutput(full);
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setManageError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setManageLoading(false);
      manageAbortRef.current = null;
    }
  };

  const copyManageOutput = () => {
    navigator.clipboard.writeText(manageOutput).then(() => {
      const btn = document.getElementById("manage-copy-btn");
      if (btn) { btn.textContent = "已复制 ✓"; setTimeout(() => { btn.textContent = "复制 MDX"; }, 2000); }
    });
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
          AI 问答 · 文章生成 · 笔记管理
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
        <button
          onClick={() => { setTab("manage"); setManageIdx(-1); setManageOutput(""); setManageInstruction(""); setManageError(""); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === "manage"
              ? "bg-white dark:bg-slate-700 text-zinc-900 dark:text-slate-100 shadow-sm"
              : "text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-300"
          }`}
        >
          📝 管理笔记
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
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300">
              描述你想写的笔记
            </label>
            <textarea
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateArticle();
                }
              }}
              placeholder="例如：写一篇对比 Python 主流 web 框架的文章，重点推荐 Litestar"
              rows={4}
              disabled={genLoading}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
            <p className="text-[10px] text-zinc-400 dark:text-slate-500">
              AI 会自动生成标题、标签、简介和正文，你只需描述想法。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={generateArticle}
              disabled={genLoading || !genPrompt.trim()}
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

      {/* ============================================================ */}
      {/*  Manage Notes Tab                                           */}
      {/* ============================================================ */}
      {tab === "manage" && (
        <div className="space-y-6">
          {/* Select article */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">
              选择笔记
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {articles.map((a, i) => (
                <button
                  key={i}
                  onClick={() => { setManageIdx(i); setManageOutput(""); setManageInstruction(""); setManageError(""); }}
                  className={`text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                    manageIdx === i
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200"
                      : "bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 text-zinc-700 dark:text-slate-300 hover:border-zinc-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-[11px] mt-0.5 opacity-70">{a.description}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedArticle && (
            <>
              {/* Current content preview */}
              <details className="text-xs">
                <summary className="cursor-pointer text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-200">
                  查看原文 ({selectedArticle.content.length} 字)
                </summary>
                <pre className="mt-2 p-4 rounded-xl bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800 text-xs text-zinc-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                  {selectedArticle.content.slice(0, 3000)}
                  {selectedArticle.content.length > 3000 && "\n\n... (内容已截断)"}
                </pre>
              </details>

              {/* Rewrite instruction */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300">
                  AI 重构指令
                </label>
                <textarea
                  value={manageInstruction}
                  onChange={(e) => setManageInstruction(e.target.value)}
                  placeholder="例如：把开头改得更文艺，加入一个对比表格，删除第二段"
                  rows={3}
                  disabled={manageLoading}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={rewriteArticle}
                    disabled={manageLoading || !manageInstruction.trim()}
                    className="px-5 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 transition-all"
                  >
                    {manageLoading ? "重构中..." : "🔮 AI 重构"}
                  </button>
                  {manageLoading && (
                    <button
                      onClick={() => manageAbortRef.current?.abort()}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      停止
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-slate-500">
                  AI 会输出修改后的完整 MDX，包含 frontmatter。手动操作（重命名/删除/隐藏）请直接编辑仓库文件。
                </p>
              </div>

              {manageError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
                  {manageError}
                </div>
              )}

              {/* Rewrite output */}
              {manageOutput && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-500 dark:text-slate-400">重构结果</h3>
                    <button
                      id="manage-copy-btn"
                      onClick={copyManageOutput}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-slate-300 hover:bg-zinc-300 dark:hover:bg-slate-600 transition-all"
                    >
                      复制 MDX
                    </button>
                  </div>
                  <pre className="p-5 rounded-2xl bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800 text-xs text-zinc-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto">
                    {manageOutput}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
