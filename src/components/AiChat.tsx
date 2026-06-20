/**
 * AiChat.tsx — 默涌：静默的思考伙伴
 *
 * A floating AI chat companion. Minimal, glassmorphism, Apple-inspired.
 *
 * SECURITY MODEL:
 * - All sensitive data (API key, messages) is encrypted with AES-GCM in localStorage.
 * - Each profile has a user-chosen PIN. The PIN is never stored — only its SHA-256 hash.
 * - Without the PIN, localStorage blobs are unreadable ciphertext.
 * - Decrypted data lives only in React state (memory), never persisted plain.
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
  model: "gpt-4.1-mini",
};

// ----- Storage keys -----
const PROFILE_KEY = "ai_chat_profile";
const PROFILES_KEY = "ai_chat_profiles";
function configKey(p: string) { return `ai_chat_config_${p}`; }
function messagesKey(p: string) { return `ai_chat_messages_${p}`; }
function pinHashKey(p: string) { return `ai_chat_pin_hash_${p}`; }

// ============================================================
//  Crypto utilities (Web Crypto API — AES-GCM + PBKDF2)
// ============================================================

function bufToB64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}

function b64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt plaintext with PIN → "salt:iv:ciphertext" (all base64) */
async function encrypt(plaintext: string, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return [bufToB64(salt), bufToB64(iv), bufToB64(new Uint8Array(ct))].join(":");
}

/** Decrypt "salt:iv:ciphertext" with PIN → plaintext (throws on wrong PIN) */
async function decrypt(encrypted: string, pin: string): Promise<string> {
  const [saltB64, ivB64, ctB64] = encrypted.split(":");
  const salt = b64ToBuf(saltB64);
  const iv = b64ToBuf(ivB64);
  const ct = b64ToBuf(ctB64);
  const key = await deriveKey(pin, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct,
  );
  return new TextDecoder().decode(decrypted);
}

/** SHA-256 hash of PIN → base64 (stored for verification without knowing the PIN) */
async function hashPIN(pin: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(pin),
  );
  return bufToB64(new Uint8Array(hash));
}

// ============================================================
//  Hooks & helpers
// ============================================================

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

function renderMarkdown(text: string): string {
  let html = text;
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
    `<pre class="bg-zinc-100 dark:bg-slate-800 rounded-lg p-3 my-2 overflow-x-auto text-xs"><code>${escapeHtml(code.trim())}</code></pre>`,
  );
  html = html.replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline">$1</a>');
  html = html.replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold mt-3 mb-1">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>');
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/\n\n/g, "</p><p class=\"mb-2\">");
  html = html.replace(/\n/g, "<br/>");
  html = `<p class="mb-2">${html}</p>`;
  html = html.replace(/<p class="mb-2"><\/p>/g, "");
  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

// ============================================================
//  Main Component
// ============================================================

export default function AiChat({ pageTitle = "", pageDescription = "" }: AiChatProps) {
  // ----- profile -----
  const [profile, setProfile] = useState<string>(() => {
    try { return localStorage.getItem(PROFILE_KEY) || "default"; }
    catch { return "default"; }
  });

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, profile);
    try {
      const list: string[] = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
      if (!list.includes(profile)) {
        list.push(profile);
        localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
      }
    } catch {}
  }, [profile]);

  // ----- lock state -----
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");           // only in memory, never persisted
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // ----- data state (decrypted in memory) -----
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [config, setConfig] = useState<AiConfig>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Check if profile has a PIN set (i.e. needs unlocking)
  const profileHasPIN = useCallback((p: string): boolean => {
    try { return !!localStorage.getItem(pinHashKey(p)); }
    catch { return false; }
  }, []);

  // ----- Unlock flow -----
  const tryUnlock = useCallback(async (profileName: string, enteredPin: string) => {
    setVerifying(true);
    setPinError("");
    try {
      const storedHash = localStorage.getItem(pinHashKey(profileName));
      if (!storedHash) {
        // No PIN set yet — this is a new or unprotected profile
        setPin(enteredPin);
        setUnlocked(true);
        // Load plain data if it exists
        tryLoadData(profileName, null);
        return;
      }
      // Verify PIN
      const computedHash = await hashPIN(enteredPin);
      if (computedHash !== storedHash) {
        setPinError("PIN 不正确");
        setVerifying(false);
        return;
      }
      // PIN correct — decrypt data
      setPin(enteredPin);
      setUnlocked(true);
      await tryLoadData(profileName, enteredPin);
    } catch {
      setPinError("解密失败，PIN 可能不正确");
    }
    setVerifying(false);
  }, []);

  const tryLoadData = async (profileName: string, pinStr: string | null) => {
    // Load config
    try {
      const encCfg = localStorage.getItem(configKey(profileName));
      if (encCfg) {
        const plain = pinStr ? await decrypt(encCfg, pinStr) : encCfg;
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(plain) });
        setShowSettings(false);
      } else {
        setConfig(DEFAULT_CONFIG);
        setShowSettings(true);
      }
    } catch {
      setConfig(DEFAULT_CONFIG);
      setShowSettings(true);
    }

    // Load messages
    try {
      const encMsg = localStorage.getItem(messagesKey(profileName));
      if (encMsg) {
        const plain = pinStr ? await decrypt(encMsg, pinStr) : encMsg;
        setMessages(JSON.parse(plain));
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  };

  // On mount: check if we need to unlock
  useEffect(() => {
    if (profileHasPIN(profile)) {
      setUnlocked(false);
    } else {
      // No PIN set — try loading plain (legacy data or first-time)
      setUnlocked(true);
      tryLoadData(profile, null);
    }
  }, [profile, profileHasPIN]);

  // Focus PIN input when locked panel opens
  useEffect(() => {
    if (isOpen && !unlocked) {
      setTimeout(() => pinInputRef.current?.focus(), 200);
    }
  }, [isOpen, unlocked]);

  // ----- Persistence (encrypted) -----
  const persistConfig = useCallback(async (cfg: AiConfig) => {
    if (!unlocked || !pin) return;
    setConfig(cfg);
    try {
      const plain = JSON.stringify(cfg);
      const enc = await encrypt(plain, pin);
      localStorage.setItem(configKey(profile), enc);
    } catch {}
  }, [unlocked, pin, profile]);

  const persistMessages = useCallback(async (msgs: Message[]) => {
    if (!unlocked || !pin) return;
    try {
      const plain = JSON.stringify(msgs);
      const enc = await encrypt(plain, pin);
      localStorage.setItem(messagesKey(profile), enc);
    } catch {}
  }, [unlocked, pin, profile]);

  // Auto-persist messages on change
  useEffect(() => {
    if (unlocked && messages.length > 0) {
      persistMessages(messages);
    }
  }, [messages, unlocked]);

  // ----- Set PIN (first-time or change) -----
  const setNewPIN = useCallback(async (newPin: string) => {
    if (!newPin.trim()) return;
    setPin(newPin);
    setUnlocked(true);
    const hash = await hashPIN(newPin);
    localStorage.setItem(pinHashKey(profile), hash);
    // Immediately encrypt existing data with new PIN
    await persistConfig(config);
    await persistMessages(messages);
  }, [profile, config, messages, persistConfig, persistMessages]);

  // ----- Lock -----
  const lock = useCallback(() => {
    setUnlocked(false);
    setPin("");
    setPinInput("");
    setConfig(DEFAULT_CONFIG);
    setMessages([]);
    setError("");
  }, []);

  // ----- Auto-scroll / focus / Esc -----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    if (isOpen && unlocked && !showSettings && !isLoading) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, unlocked, showSettings, isLoading]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

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
    if (!config.apiKey) { setShowSettings(true); setError("请先配置 API 密钥。"); return; }

    setError("");
    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiMessages = [
        { role: "system", content: buildSystemPrompt() },
        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ model: config.model, messages: apiMessages, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.text();
        let msg = `请求失败 (${response.status})`;
        try { msg = JSON.parse(err).error?.message || msg; } catch {}
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
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try { fullContent += JSON.parse(data).choices?.[0]?.delta?.content || ""; } catch {}
          setStreamingText(fullContent);
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setIsLoading(false);
      setStreamingText("");
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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

  const switchProfile = (newProfile: string) => {
    const trimmed = newProfile.trim();
    if (!trimmed || trimmed === profile) return;
    lock(); // lock before switching
    setProfile(trimmed);
    setInput("");
    setStreamingText("");
    setPinInput("");
  };

  const getProfileList = (): string[] => {
    try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]"); }
    catch { return []; }
  };

  // ----- Render -----
  const isLocked = profileHasPIN(profile) && !unlocked;

  return (
    <>
      {/* ===== Floating Button ===== */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          fixed bottom-6 right-6 z-40
          w-12 h-12 rounded-2xl
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
          border border-zinc-200/60 dark:border-slate-700/60
          shadow-[0_4px_24px_rgba(0,0,0,0.06)]
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:scale-105 active:scale-95
          ${isOpen ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"}
        `}
        aria-label="打开思考伙伴"
      >
        <span className="relative flex items-center justify-center">
          {isLocked ? (
            <LockIcon className="w-5 h-5 text-zinc-400 dark:text-slate-500" />
          ) : (
            <SparkleIcon className="w-5 h-5 text-zinc-500 dark:text-slate-400" />
          )}
          {!isLocked && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-5 h-5 rounded-full bg-blue-400/20 dark:bg-blue-400/30 animate-ping opacity-75" />
            </span>
          )}
        </span>
      </button>

      {/* ===== Chat Panel ===== */}
      {isOpen && (
        <div
          ref={panelRef}
          className={`
            fixed bottom-20 right-6 z-40
            w-[calc(100vw-3rem)] sm:w-96 max-h-[560px]
            rounded-3xl
            bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl
            border border-zinc-200/50 dark:border-slate-700/50
            shadow-[0_16px_56px_rgba(0,0,0,0.10)]
            flex flex-col overflow-hidden
            transition-all duration-300 ease-out
          `}
        >
          {/* ----- Header ----- */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                {isLocked ? (
                  <LockIcon className="w-3.5 h-3.5 text-zinc-400 dark:text-slate-500" />
                ) : (
                  <SparkleIcon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-800 dark:text-slate-200 tracking-tight">默涌</span>
                <span className="text-[10px] text-zinc-400 dark:text-slate-500 bg-zinc-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-mono">
                  @{profile}
                </span>
                {isLocked && (
                  <span className="text-[10px] text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                    已锁定
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unlocked && (
                <>
                  <button onClick={clearConversation} className="p-1.5 rounded-lg text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-all duration-200" title="清空对话">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" /></svg>
                  </button>
                  <button onClick={() => setShowSettings((p) => !p)} className={`p-1.5 rounded-lg transition-all duration-200 ${showSettings ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" : "text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800"}`} title="设置">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                  </button>
                </>
              )}
              <button onClick={close} className="p-1.5 rounded-lg text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-all duration-200" title="关闭">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/*  LOCKED SCREEN                                               */}
          {/* ============================================================ */}
          {isLocked && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <LockIcon className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-zinc-800 dark:text-slate-200">
                  @{profile} 已锁定
                </p>
                <p className="text-xs text-zinc-400 dark:text-slate-500 leading-relaxed">
                  输入 PIN 以解密数据。数据使用 AES-GCM 加密，仅你可知。
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pinInput.trim()) tryUnlock(profile, pinInput.trim());
                }}
                className="w-full space-y-2"
              >
                <input
                  ref={pinInputRef}
                  type="password"
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setPinError(""); }}
                  placeholder="PIN"
                  maxLength={64}
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-center tracking-widest bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                {pinError && (
                  <p className="text-xs text-red-500 dark:text-red-400 text-center">{pinError}</p>
                )}
                <button
                  type="submit"
                  disabled={verifying || !pinInput.trim()}
                  className="w-full py-2 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-all duration-200"
                >
                  {verifying ? "验证中..." : "解锁"}
                </button>
              </form>
              {/* Profile switcher */}
              <div className="w-full pt-2 border-t border-zinc-100 dark:border-slate-800">
                <p className="text-[10px] text-zinc-400 dark:text-slate-500 mb-1.5 text-center">或切换身份</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {getProfileList().map((p) => (
                    <button
                      key={p}
                      onClick={() => switchProfile(p)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all ${
                        p === profile
                          ? "bg-zinc-200 dark:bg-slate-700 text-zinc-700 dark:text-slate-300"
                          : "bg-zinc-50 dark:bg-slate-800 text-zinc-400 dark:text-slate-500 hover:bg-zinc-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      @{p}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const name = prompt("新身份名称：");
                      if (name?.trim()) switchProfile(name.trim());
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono border border-dashed border-zinc-300 dark:border-slate-600 text-zinc-400 dark:text-slate-500 hover:border-zinc-400 hover:text-zinc-600 transition-all"
                  >
                    + 新建
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/*  UNLOCKED: Settings                                         */}
          {/* ============================================================ */}
          {unlocked && showSettings && (
            <div className="px-5 py-4 space-y-3 border-b border-zinc-100 dark:border-slate-800 bg-zinc-50/50 dark:bg-slate-950/30">
              {/* Profile */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">身份</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    defaultValue={profile}
                    onKeyDown={(e) => { if (e.key === "Enter") switchProfile((e.target as HTMLInputElement).value); }}
                    onBlur={(e) => switchProfile(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button onClick={lock} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all flex items-center gap-1">
                    <LockIcon className="w-3 h-3" /> 锁定
                  </button>
                </div>
                {getProfileList().length > 1 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {getProfileList().map((p) => (
                      <button key={p} onClick={() => switchProfile(p)} className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all ${p === profile ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400 hover:bg-zinc-200 dark:hover:bg-slate-700"}`}>@{p}</button>
                    ))}
                    <button onClick={() => { const name = prompt("新身份名称："); if (name?.trim()) switchProfile(name.trim()); }} className="px-2 py-0.5 rounded-md text-[10px] font-mono border border-dashed border-zinc-300 dark:border-slate-600 text-zinc-400 dark:text-slate-500 hover:border-zinc-400 hover:text-zinc-600 transition-all">+ 新建</button>
                  </div>
                )}
              </div>

              {/* PIN */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">
                  PIN {profileHasPIN(profile) ? "(已设置 · 可更改)" : "(首次设置)"}
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = (e.currentTarget.elements.namedItem("settingsPin") as HTMLInputElement).value.trim();
                    if (val) { setNewPIN(val); (e.target as HTMLFormElement).reset(); }
                  }}
                >
                  <input
                    name="settingsPin"
                    type="password"
                    placeholder={profileHasPIN(profile) ? "输入新 PIN 以更改" : "设置 PIN"}
                    maxLength={64}
                    autoComplete="new-password"
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </form>
                <p className="text-[10px] text-zinc-400 dark:text-slate-500 mt-1">
                  PIN 不存储。数据通过 AES-GCM 加密，仅 PIN 可解。
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">API 端点</label>
                {/* Provider presets */}
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {([
                    { label: "OpenAI", endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4.1-mini" },
                    { label: "DeepSeek", endpoint: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-v4-flash" },
                    { label: "DeepSeek Pro", endpoint: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-v4-pro" },
                    { label: "Anthropic", endpoint: "https://api.anthropic.com/v1/messages", model: "claude-sonnet-4-20250514" },
                    { label: "OpenRouter", endpoint: "https://openrouter.ai/api/v1/chat/completions", model: "openai/gpt-4.1-mini" },
                  ] as const).map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, endpoint: p.endpoint, model: p.model }))}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                        config.endpoint === p.endpoint && config.model === p.model
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400 hover:bg-zinc-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input type="url" value={config.endpoint} onChange={(e) => setConfig((c) => ({ ...c, endpoint: e.target.value }))} placeholder="https://api.openai.com/v1/chat/completions" className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">模型</label>
                <input type="text" value={config.model} onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))} placeholder="gpt-4o-mini" className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">API 密钥</label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Prevent form submission from refreshing — persist handled by save button
                  }}
                >
                  <input type="password" value={config.apiKey} onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))} placeholder="sk-..." autoComplete="current-password" className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </form>
              </div>
              <button
                onClick={async () => {
                  await persistConfig(config);
                  setShowSettings(false);
                  setError("");
                }}
                className="w-full py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
              >
                保存配置
              </button>
              {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
            </div>
          )}

          {/* ============================================================ */}
          {/*  UNLOCKED: Messages                                         */}
          {/* ============================================================ */}
          {unlocked && !showSettings && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[120px]">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                      <SparkleIcon className="w-5 h-5 text-blue-400 dark:text-blue-500" />
                    </div>
                    <p className="text-sm text-zinc-400 dark:text-slate-500 leading-relaxed">有什么想聊的？</p>
                    {pageTitle && <p className="text-xs text-zinc-300 dark:text-slate-600 mt-1">当前页面：{pageTitle}</p>}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-md" : "bg-zinc-100 dark:bg-slate-800 text-zinc-800 dark:text-slate-200 rounded-bl-md"}`}>
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose-sm prose-zinc dark:prose-invert max-w-none [&_p]:mb-1 [&_pre]:my-1" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && streamingText && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-zinc-100 dark:bg-slate-800 text-zinc-800 dark:text-slate-200 text-sm leading-relaxed">
                      <div className="prose-sm prose-zinc dark:prose-invert max-w-none [&_p]:mb-1 [&_pre]:my-1" dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) }} />
                      <span className="inline-block w-1.5 h-4 bg-zinc-400 dark:bg-slate-500 animate-pulse ml-0.5 align-middle" />
                    </div>
                  </div>
                )}

                {isLoading && !streamingText && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-zinc-100 dark:bg-slate-800 text-sm text-zinc-500 dark:text-slate-400">默涌正在思考<LoadingDots /></div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-center">
                    <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">{error}</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ----- Input ----- */}
              <div className="px-4 py-3 border-t border-zinc-100 dark:border-slate-800">
                {!config.apiKey ? (
                  <button onClick={() => setShowSettings(true)} className="w-full py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200">配置 API 密钥以开始对话</button>
                ) : (
                  <div className="flex items-end gap-2">
                    <textarea ref={textareaRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="输入你的思考..." rows={1} disabled={isLoading} className="flex-1 px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-800 dark:text-slate-200 placeholder-zinc-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none max-h-[120px] disabled:opacity-50" />
                    {isLoading ? (
                      <button onClick={stopStreaming} className="flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-200 dark:bg-slate-700 flex items-center justify-center transition-all duration-200 hover:bg-zinc-300 dark:hover:bg-slate-600" title="停止生成">
                        <svg className="w-4 h-4 text-zinc-500 dark:text-slate-400" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                      </button>
                    ) : (
                      <button onClick={sendMessage} disabled={!input.trim()} className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center transition-all duration-200 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed" title="发送">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
