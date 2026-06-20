/**
 * AiChat.tsx — 默涌：静默的思考伙伴
 *
 * A floating AI chat companion. Minimal, glassmorphism, Apple-inspired.
 * Speaks in a terse, philosophical tone matching the Digital Garden aesthetic.
 *
 * USER ISOLATION: all data (API key, messages) is scoped by a profile name.
 * Each visitor picks a profile — different profiles never share data.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ----- Types -----
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiChatProps {
  pageTitle?: string;
  pageDescription?: string;
}

interface AiConfig {
  apiKey: string;
  endpoint: string;
  model: string;
}

const DEFAULT_CONFIG: AiConfig = {
  apiKey: "",
  endpoint: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
};

// ----- Storage keys (profile-scoped) -----
const PROFILE_KEY = "ai_chat_profile";
const PROFILES_KEY = "ai_chat_profiles";
function configKey(profile: string) { return `ai_chat_config_${profile}`; }
function messagesKey(profile: string) { return `ai_chat_messages_${profile}`; }

// ----- Hook: detect click outside -----
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

// ----- Simple Markdown → HTML -----
function renderMarkdown(text: string): string {
  let html = text;
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre class="bg-zinc-100 dark:bg-slate-800 rounded-lg p-3 my-2 overflow-x-auto text-xs"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, "<code class=\"bg-zinc-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono\">$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-blue-600 dark:text-blue-400 underline\">$1</a>");
  html = html.replace(/^### (.+)$/gm, "<h4 class=\"text-sm font-semibold mt-3 mb-1\">$1</h4>");
  html = html.replace(/^## (.+)$/gm, "<h3 class=\"text-base font-semibold mt-4 mb-1\">$1</h3>");
  html = html.replace(/^# (.+)$/gm, "<h2 class=\"text-lg font-semibold mt-4 mb-2\">$1</h2>");
  html = html.replace(/^[-*] (.+)$/gm, "<li class=\"ml-4 list-disc\">$1</li>");
  html = html.replace(/\n\n/g, "</p><p class=\"mb-2\">");
  html = html.replace(/\n/g, "<br/>");
  html = `<p class="mb-2">${html}</p>`;
  html = html.replace(/<p class="mb-2"><\/p>/g, "");
  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ----- Sub-components -----
function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z" opacity="0.5" />
      <path d="M6 4l.5 1.5L8 6l-1.5.5L6 8l-.5-1.5L4 6l1.5-.5z" opacity="0.3" />
    </svg>
  );
}

// ===== Main Component =====
export default function AiChat({ pageTitle = "", pageDescription = "" }: AiChatProps) {
  // ----- Profile -----
  const [profile, setProfile] = useState<string>(() => {
    try {
      return localStorage.getItem(PROFILE_KEY) || "default";
    } catch {
      return "default";
    }
  });

  // Persist profile name
  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, profile);
    // Also add to profiles list
    try {
      const list = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
      if (!list.includes(profile)) {
        list.push(profile);
        localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
      }
    } catch {}
  }, [profile]);

  // ----- State (all scoped by profile) -----
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(messagesKey(profile));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [config, setConfig] = useState<AiConfig>(() => {
    try {
      const saved = localStorage.getItem(configKey(profile));
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  const [showSettings, setShowSettings] = useState(!config.apiKey);
  const [error, setError] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reload data when profile changes
  useEffect(() => {
    try {
      const savedCfg = localStorage.getItem(configKey(profile));
      setConfig(savedCfg ? { ...DEFAULT_CONFIG, ...JSON.parse(savedCfg) } : DEFAULT_CONFIG);
      const savedMsg = localStorage.getItem(messagesKey(profile));
      setMessages(savedMsg ? JSON.parse(savedMsg) : []);
      setShowSettings(!savedCfg || !(savedCfg.includes("apiKey") && JSON.parse(savedCfg).apiKey));
    } catch {
      setConfig(DEFAULT_CONFIG);
      setMessages([]);
      setShowSettings(true);
    }
  }, [profile]);

  // Persist messages (scoped)
  useEffect(() => {
    localStorage.setItem(messagesKey(profile), JSON.stringify(messages));
  }, [messages, profile]);

  // Persist config (scoped)
  const saveConfig = useCallback((c: AiConfig) => {
    setConfig(c);
    localStorage.setItem(configKey(profile), JSON.stringify(c));
  }, [profile]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Auto-focus
  useEffect(() => {
    if (isOpen && !showSettings && !isLoading) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, showSettings, isLoading]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowSettings(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setShowSettings(false);
  }, []);

  useClickOutside(panelRef, close);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // System prompt
  const buildSystemPrompt = (): string => {
    const base = `你是 Digital Garden 中的思考伙伴——「默涌」。你的风格：简洁、深邃、不啰嗦，用中文回应。每次回复不超过四句话。问你想问的，而非替用户下判断。`;
    if (pageTitle) {
      return `${base}\n\n用户正在浏览：《${pageTitle}》${pageDescription ? `——${pageDescription}` : ""}。`;
    }
    return `${base}\n\n用户正在 Digital Garden 的数字花园中漫游。`;
  };

  // ----- Send message -----
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (!config.apiKey) {
      setShowSettings(true);
      setError("请先配置 API 密钥。");
      return;
    }

    setError("");
    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const systemPrompt = buildSystemPrompt();
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: apiMessages,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.text();
        let msg = `请求失败 (${response.status})`;
        try {
          const j = JSON.parse(err);
          msg = j.error?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            fullContent += content;
            setStreamingText(fullContent);
          } catch {}
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "未知错误";
      setError(msg);
    } finally {
      setIsLoading(false);
      setStreamingText("");
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(messagesKey(profile));
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    if (streamingText) {
      setMessages((prev) => [...prev, { role: "assistant", content: streamingText }]);
    }
    setIsLoading(false);
    setStreamingText("");
  };

  // ----- Profile switching -----
  const switchProfile = (newProfile: string) => {
    const trimmed = newProfile.trim();
    if (!trimmed || trimmed === profile) return;
    setProfile(trimmed);
    setError("");
    setInput("");
    setStreamingText("");
  };

  const getProfileList = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
    } catch {
      return [];
    }
  };

  return (
    <>
      {/* ===== Floating Button ===== */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          fixed bottom-6 right-6 z-40
          w-12 h-12
          rounded-2xl
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
          border border-zinc-200/60 dark:border-slate-700/60
          shadow-[0_4px_24px_rgba(0,0,0,0.06)]
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)]
          hover:scale-105
          active:scale-95
          ${isOpen ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"}
        `}
        aria-label="打开思考伙伴"
      >
        <span className="relative flex items-center justify-center">
          <SparkleIcon className="w-5 h-5 text-zinc-500 dark:text-slate-400" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-5 h-5 rounded-full bg-blue-400/20 dark:bg-blue-400/30 animate-ping opacity-75" />
          </span>
        </span>
      </button>

      {/* ===== Chat Panel ===== */}
      {isOpen && (
        <div
          ref={panelRef}
          className={`
            fixed bottom-20 right-6 z-40
            w-[calc(100vw-3rem)] sm:w-96
            max-h-[560px]
            rounded-3xl
            bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl
            border border-zinc-200/50 dark:border-slate-700/50
            shadow-[0_16px_56px_rgba(0,0,0,0.10)]
            flex flex-col
            overflow-hidden
            transition-all duration-300 ease-out
          `}
        >
          {/* ----- Header ----- */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <SparkleIcon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-800 dark:text-slate-200 tracking-tight">
                  默涌
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-slate-500 bg-zinc-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-mono">
                  @{profile}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearConversation}
                className="p-1.5 rounded-lg text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-all duration-200"
                title="清空对话"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                </svg>
              </button>
              <button
                onClick={() => setShowSettings((p) => !p)}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  showSettings
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                    : "text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800"
                }`}
                title="设置"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>
              <button
                onClick={close}
                className="p-1.5 rounded-lg text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-all duration-200"
                title="关闭"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ----- Settings Panel ----- */}
          {showSettings && (
            <div className="px-5 py-4 space-y-3 border-b border-zinc-100 dark:border-slate-800 bg-zinc-50/50 dark:bg-slate-950/30">
              {/* Profile switcher */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">
                  身份 (profile)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    defaultValue={profile}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        switchProfile((e.target as HTMLInputElement).value);
                      }
                    }}
                    onBlur={(e) => switchProfile(e.target.value)}
                    placeholder="输入身份名称以隔离数据"
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {/* Existing profiles quick-switch */}
                {getProfileList().length > 1 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {getProfileList().map((p) => (
                      <button
                        key={p}
                        onClick={() => switchProfile(p)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all ${
                          p === profile
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400 hover:bg-zinc-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        @{p}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-zinc-400 dark:text-slate-500 mt-1">
                  切换身份后，API 密钥与对话记录完全隔离。
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">API 端点</label>
                <input
                  ref={inputRef}
                  type="url"
                  value={config.endpoint}
                  onChange={(e) => setConfig((c) => ({ ...c, endpoint: e.target.value }))}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">模型</label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
                  placeholder="gpt-4o-mini"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">API 密钥</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  saveConfig(config);
                  setShowSettings(false);
                  setError("");
                }}
                className="w-full py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
              >
                保存配置
              </button>
              {error && (
                <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
              )}
            </div>
          )}

          {/* ----- Messages Area ----- */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[120px]">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                  <SparkleIcon className="w-5 h-5 text-blue-400 dark:text-blue-500" />
                </div>
                <p className="text-sm text-zinc-400 dark:text-slate-500 leading-relaxed">
                  有什么想聊的？
                </p>
                {pageTitle && (
                  <p className="text-xs text-zinc-300 dark:text-slate-600 mt-1">
                    当前页面：{pageTitle}
                  </p>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-zinc-100 dark:bg-slate-800 text-zinc-800 dark:text-slate-200 rounded-bl-md"
                    }
                  `}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div
                      className="prose-sm prose-zinc dark:prose-invert max-w-none [&_p]:mb-1 [&_pre]:my-1"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  )}
                </div>
              </div>
            ))}

            {isLoading && streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-zinc-100 dark:bg-slate-800 text-zinc-800 dark:text-slate-200 text-sm leading-relaxed">
                  <div
                    className="prose-sm prose-zinc dark:prose-invert max-w-none [&_p]:mb-1 [&_pre]:my-1"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) }}
                  />
                  <span className="inline-block w-1.5 h-4 bg-zinc-400 dark:bg-slate-500 animate-pulse ml-0.5 align-middle" />
                </div>
              </div>
            )}

            {isLoading && !streamingText && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-zinc-100 dark:bg-slate-800 text-sm text-zinc-500 dark:text-slate-400">
                  默涌正在思考<LoadingDots />
                </div>
              </div>
            )}

            {error && !showSettings && (
              <div className="flex justify-center">
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
                  {error}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ----- Input Area ----- */}
          <div className="px-4 py-3 border-t border-zinc-100 dark:border-slate-800">
            {!config.apiKey ? (
              <button
                onClick={() => setShowSettings(true)}
                className="w-full py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
              >
                配置 API 密钥以开始对话
              </button>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="输入你的思考..."
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none max-h-[120px] disabled:opacity-50"
                />
                {isLoading ? (
                  <button
                    onClick={stopStreaming}
                    className="flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-200 dark:bg-slate-700 flex items-center justify-center transition-all duration-200 hover:bg-zinc-300 dark:hover:bg-slate-600"
                    title="停止生成"
                  >
                    <svg className="w-4 h-4 text-zinc-500 dark:text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center transition-all duration-200 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="发送"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
