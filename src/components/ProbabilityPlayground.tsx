/**
 * ProbabilityPlayground.tsx — Poisson Explorer + Monte Carlo Simulator
 *
 * Two-layer rendering:
 *   Simulation layer — runs at ~25fps, accumulates Poisson samples
 *   Visual layer    — runs at 60fps via rAF, smoothly interpolates bar heights
 *
 * Result: bars visibly "grow" and settle toward theoretical values,
 * with individual trial dots appearing briefly in each column.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
//  Poisson PMF & sampling
// ============================================================

const FACT: number[] = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
function fact(n: number): number {
  if (n < FACT.length) return FACT[n];
  let r = FACT[FACT.length - 1];
  for (let i = FACT.length; i <= n; i++) { r *= i; FACT.push(r); }
  return r;
}

function poissonPMF(k: number, lambda: number): number {
  if (k < 0 || lambda <= 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact(k);
}

function samplePoisson(lambda: number): number {
  const u = Math.random();
  let cum = 0;
  for (let k = 0; k < 100; k++) {
    cum += poissonPMF(k, lambda);
    if (u <= cum) return k;
  }
  return Math.floor(lambda);
}

// ============================================================
//  Particle: a single trial dot
// ============================================================

interface Particle {
  x: number;        // target column center
  y: number;        // current y (falls from top)
  vy: number;       // velocity
  column: number;   // which k value
  life: number;     // 1 → 0, fades out
  color: string;
}

// ============================================================
//  Canvas rendering
// ============================================================

interface BarTarget {
  label: string;
  theoretical: number;  // target probability
  empirical: number;    // raw count (for simulation)
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bars: BarTarget[],
  trials: number,
  maxK: number,
  animatedHeights: number[],  // 0..ch, smoothly interpolated
  particles: Particle[],
  isDark: boolean,
  flashColumns: Set<number>,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  const pad = { top: 24, right: 16, bottom: 36, left: 44 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  const maxTheo = Math.max(0.02, ...bars.map((b) => b.theoretical));
  const barW = Math.max(6, Math.min(32, (cw - (bars.length - 1) * 5) / bars.length));
  const gap = Math.max(3, (cw - barW * bars.length) / (bars.length + 1));

  // Grid
  ctx.strokeStyle = isDark ? "rgba(148,163,184,0.12)" : "rgba(161,161,170,0.18)";
  ctx.lineWidth = 0.5;
  for (let i = 1; i <= 3; i++) {
    const y = pad.top + (ch / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = isDark ? "#64748b" : "#a1a1aa";
    ctx.font = "9px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(((maxTheo / 3) * (3 - i) * 100).toFixed(0) + "%", pad.left - 6, y + 4);
  }

  // Bars
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const x = pad.left + gap + i * (barW + gap);

    // Theoretical ghost (always visible)
    const tH = Math.max(1, (b.theoretical / maxTheo) * ch);
    ctx.fillStyle = isDark ? "rgba(59,130,246,0.20)" : "rgba(59,130,246,0.22)";
    ctx.fillRect(x, pad.top + ch - tH, barW, tH);

    // Animated empirical bar
    if (trials > 0) {
      const aH = animatedHeights[i] ?? 0;
      if (aH > 0.5) {
        // Glow on recently-hit columns
        const flashing = flashColumns.has(i);
        ctx.fillStyle = flashing
          ? (isDark ? "rgba(96,165,250,0.95)" : "rgba(37,99,235,0.95)")
          : (isDark ? "rgba(96,165,250,0.75)" : "rgba(37,99,235,0.75)");
        ctx.fillRect(x, pad.top + ch - aH, barW, aH);
        // Thin border
        ctx.strokeStyle = isDark ? "#1e293b" : "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, pad.top + ch - aH, barW, aH);
      }
    }

    // X label
    ctx.fillStyle = isDark ? "#94a3b8" : "#71717a";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(b.label, x + barW / 2, H - pad.bottom + 14);
  }

  // Particles (falling dots)
  for (const p of particles) {
    if (p.life <= 0.02) continue;
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Legend
  ctx.fillStyle = isDark ? "rgba(59,130,246,0.22)" : "rgba(59,130,246,0.22)";
  ctx.fillRect(pad.left, 10, 8, 8);
  ctx.fillStyle = isDark ? "#94a3b8" : "#71717a";
  ctx.font = "9px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("理论泊松分布", pad.left + 12, 18);

  ctx.fillStyle = isDark ? "rgba(96,165,250,0.85)" : "rgba(37,99,235,0.85)";
  ctx.fillRect(pad.left + 100, 10, 8, 8);
  ctx.fillText("蒙特卡洛模拟", pad.left + 112, 18);

  ctx.restore();
}

// ============================================================
//  Constants
// ============================================================

const BATCH_SIZE = 150;
const MAX_TRIALS = 50000;
const SIM_TICK_MS = 50;    // simulation runs every 50ms
const LERP_SPEED = 0.18;   // interpolation speed per frame (60fps)

// ============================================================
//  Component
// ============================================================

export default function ProbabilityPlayground() {
  const [lambda, setLambda] = useState(2.0);
  const [trials, setTrials] = useState(0);
  const [running, setRunning] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [convergence, setConvergence] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number>(0);

  // Simulation state (refs — no re-render overhead)
  const countsRef = useRef<number[]>([]);
  const trialsRef = useRef(0);
  const maxKRef = useRef(10);
  const flashRef = useRef<Set<number>>(new Set());
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Visual state (refs — mutated by rAF)
  const animatedHeightsRef = useRef<number[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Dark mode
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Reset when lambda changes
  useEffect(() => {
    countsRef.current = [];
    trialsRef.current = 0;
    animatedHeightsRef.current = [];
    particlesRef.current = [];
    flashRef.current = new Set();
    setTrials(0);
    setConvergence(null);
  }, [lambda]);

  const maxK = Math.max(8, Math.ceil(lambda * 2 + 4));
  maxKRef.current = maxK;

  // Build bar targets
  const bars: BarTarget[] = [];
  for (let k = 0; k <= maxK; k++) {
    bars.push({
      label: String(k),
      theoretical: poissonPMF(k, lambda),
      empirical: countsRef.current[k] || 0,
    });
  }

  const maxTheo = Math.max(0.02, ...bars.map((b) => b.theoretical));

  // ---- Simulation tick ----
  const simTick = useCallback(() => {
    const c = countsRef.current;
    const mk = maxKRef.current;
    const hitCols = new Set<number>();

    for (let i = 0; i < BATCH_SIZE; i++) {
      const k = samplePoisson(lambda);
      if (k <= mk) {
        c[k] = (c[k] || 0) + 1;
        hitCols.add(k);
      }
    }

    const newTrials = trialsRef.current + BATCH_SIZE;
    countsRef.current = c;
    trialsRef.current = newTrials;
    setTrials(newTrials);

    // Flash hit columns
    flashRef.current = hitCols;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => { flashRef.current = new Set(); }, 120);

    // Spawn particles for a few recent hits
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const pad = { left: 44, right: 16, top: 24, bottom: 36 };
      const cw = rect.width - pad.left - pad.right;
      const ch = rect.height - pad.top - pad.bottom;
      const barW = Math.max(6, Math.min(32, (cw - (bars.length - 1) * 5) / bars.length));
      const gap = Math.max(3, (cw - barW * bars.length) / (bars.length + 1));
      const newParticles = particlesRef.current.filter((p) => p.life > 0.02);

      // Spawn up to 8 particles per tick in hit columns
      const hitArr = Array.from(hitCols);
      for (let j = 0; j < Math.min(8, hitArr.length * 2); j++) {
        const col = hitArr[Math.floor(Math.random() * hitArr.length)];
        const x = pad.left + gap + col * (barW + gap) + barW / 2;
        newParticles.push({
          x,
          y: pad.top + Math.random() * 10,
          vy: 2 + Math.random() * 4,
          column: col,
          life: 1,
          color: isDark ? "#93c5fd" : "#3b82f6",
        });
      }
      // Limit total particles
      while (newParticles.length > 60) newParticles.shift();
      particlesRef.current = newParticles;
    }

    // Compute convergence
    if (newTrials >= 500) {
      let maxErr = 0;
      for (let k = 0; k <= mk; k++) {
        const theo = poissonPMF(k, lambda);
        const emp = (c[k] || 0) / newTrials;
        maxErr = Math.max(maxErr, Math.abs(theo - emp) * 100);
      }
      setConvergence(Math.round(maxErr * 10) / 10);
    }

    // Stop condition
    if (newTrials >= MAX_TRIALS) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setRunning(false);
    }
  }, [lambda, bars.length, isDark]);

  // ---- Visual render loop (60fps) ----
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mk = maxKRef.current;
    const t = trialsRef.current;
    const pad = { top: 24, bottom: 36 };
    const ch = rect.height - pad.top - pad.bottom;

    // Ensure animated heights array
    if (animatedHeightsRef.current.length !== mk + 1) {
      animatedHeightsRef.current = new Array(mk + 1).fill(0);
    }

    // Lerp animated heights toward target (empirical height)
    const ah = animatedHeightsRef.current;
    for (let i = 0; i <= mk; i++) {
      const targetH = t > 0 ? ((countsRef.current[i] || 0) / t / maxTheo) * ch : 0;
      const targetClamped = Math.min(ch, Math.max(0, targetH));
      ah[i] = ah[i] + (targetClamped - ah[i]) * LERP_SPEED;
    }

    // Update particles
    const pts = particlesRef.current;
    for (const p of pts) {
      // Target y = bottom of column
      const targetY = pad.top + ch - (ah[p.column] || 0);
      if (p.y < targetY - 2) {
        p.vy += 0.5; // gravity
        p.y += p.vy;
      } else {
        p.life -= 0.03;
      }
    }

    drawFrame(ctx, rect.width, rect.height, bars, t, mk, ah, pts, isDark, flashRef.current);
  }, [bars, isDark, maxTheo]);

  // ---- Start / stop simulation ----
  const startSim = () => {
    if (trials >= MAX_TRIALS) {
      countsRef.current = [];
      trialsRef.current = 0;
      animatedHeightsRef.current = [];
      particlesRef.current = [];
      flashRef.current = new Set();
      setTrials(0);
      setConvergence(null);
    }
    setRunning(true);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    simTimerRef.current = setInterval(simTick, SIM_TICK_MS);
  };

  const stopSim = () => {
    setRunning(false);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
  };

  const resetSim = () => {
    stopSim();
    countsRef.current = [];
    trialsRef.current = 0;
    animatedHeightsRef.current = [];
    particlesRef.current = [];
    flashRef.current = new Set();
    setTrials(0);
    setConvergence(null);
  };

  // ---- rAF loop ----
  useEffect(() => {
    const loop = () => {
      renderFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [renderFrame]);

  // Resize
  useEffect(() => {
    const onResize = () => renderFrame();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [renderFrame]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ---- Derived ----
  const progress = Math.min(100, (trials / MAX_TRIALS) * 100);
  const isComplete = trials >= MAX_TRIALS;
  let bestK = { k: "0", prob: 0 };
  for (const b of bars) {
    if (b.theoretical > bestK.prob) bestK = { k: b.label, prob: b.theoretical };
  }

  return (
    <div className="not-prose my-8 p-5 rounded-2xl bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800">
      <h3 className="text-base font-bold text-zinc-800 dark:text-slate-200">🎮 泊松游乐场</h3>
      <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
        拖动 λ 改变理论分布，点击"蒙特卡洛模拟"——蓝色柱子会<strong>平滑生长</strong>，彩色小点会在柱子上方<strong>飘落堆积</strong>。
        你看到的是大数定律的视觉证明：随机试验越多，频率越稳定地逼近理论。
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">
            λ = <strong>{lambda.toFixed(1)}</strong>（平均每单位发生次数）
          </label>
          <input
            type="range" min="0.3" max="5" step="0.1" value={lambda}
            onChange={(e) => setLambda(parseFloat(e.target.value))}
            disabled={running}
            className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-slate-700 appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 dark:text-slate-500 mt-0.5">
            <span>稀有 (λ=0.3)</span><span>频繁 (λ=5.0)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!running && !isComplete && (
            <button onClick={startSim} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all">▶ 蒙特卡洛模拟</button>
          )}
          {running && (
            <button onClick={stopSim} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-all">⏸ 暂停</button>
          )}
          {isComplete && (
            <button onClick={startSim} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-all">🔄 重新模拟</button>
          )}
          {trials > 0 && (
            <button onClick={resetSim} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-slate-300 hover:bg-zinc-300 dark:hover:bg-slate-600 transition-all">重置</button>
          )}
        </div>
      </div>

      {/* Progress */}
      {trials > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-slate-400 mb-1">
            <span>已模拟 <strong className="text-zinc-700 dark:text-slate-200">{trials.toLocaleString()}</strong> / {MAX_TRIALS.toLocaleString()} 次{isComplete && <span className="ml-2 text-green-600 dark:text-green-400 font-medium">✓ 完成</span>}</span>
            <span>理论峰值 k = <strong>{bestK.k}</strong>（{ (bestK.prob * 100).toFixed(1) }%）</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-slate-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="w-full bg-white dark:bg-slate-950 rounded-xl border border-zinc-100 dark:border-slate-800 overflow-hidden">
        <canvas ref={canvasRef} className="w-full" style={{ height: "280px", width: "100%" }} />
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-zinc-500 dark:text-slate-400">
        <span>⬜ 浅框 = 理论分布</span>
        <span>🟦 深色柱 = 模拟频率（平滑生长）</span>
        <span>💧 彩色点 = 最新随机样本在飘落</span>
        {convergence !== null && (
          <span className="text-zinc-600 dark:text-slate-300 font-medium">
            📐 最大偏差: {convergence}% {convergence < 2 ? "✓ 已收敛" : convergence < 5 ? "(接近中)" : ""}
          </span>
        )}
      </div>

      {isComplete && (
        <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-xs text-zinc-600 dark:text-slate-300 leading-relaxed">
          <strong className="text-green-700 dark:text-green-400">🎯 模拟完成。</strong>{" "}
          经过 {MAX_TRIALS.toLocaleString()} 次随机试验，频率分布与泊松理论值的最大偏差仅 <strong>{convergence}%</strong>。
          这就是<strong>大数定律</strong>——试验次数越多，经验频率越稳定地收敛于理论概率，不可阻挡。
        </div>
      )}

      {trials === 0 && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-xs text-zinc-600 dark:text-slate-300">
          <strong>👆 试试：</strong>调 λ 选一个分布形状，点「▶ 蒙特卡洛模拟」。
          蓝色柱子会从零开始<strong>平滑生长</strong>，彩色粒子会飘落到柱子上——高概率的列落得多，低概率的列落得少。
          这就是泊松结构从随机中浮现的过程。
        </div>
      )}
    </div>
  );
}
