/**
 * ProbabilityPlayground.tsx — Poisson Explorer + Monte Carlo Simulator
 * Pure Canvas, zero dependencies. See the Law of Large Numbers in action.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
//  Poisson PMF
// ============================================================

const factorialCache: number[] = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];

function factorial(n: number): number {
  if (n < factorialCache.length) return factorialCache[n];
  let r = factorialCache[factorialCache.length - 1];
  for (let i = factorialCache.length; i <= n; i++) {
    r *= i;
    factorialCache.push(r);
  }
  return r;
}

function poissonPMF(k: number, lambda: number): number {
  if (k < 0 || lambda <= 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// ============================================================
//  Inverse transform sampling from Poisson
// ============================================================

function samplePoisson(lambda: number): number {
  const u = Math.random();
  let cum = 0;
  for (let k = 0; k < 100; k++) {
    cum += poissonPMF(k, lambda);
    if (u <= cum) return k;
  }
  return Math.floor(lambda); // fallback
}

// ============================================================
//  Canvas chart renderer
// ============================================================

interface BarData {
  label: string;
  theoretical: number;
  empirical: number | null;
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bars: BarData[],
  isDark: boolean,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  const pad = { top: 24, right: 16, bottom: 36, left: 44 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  const maxVal = Math.max(0.02, ...bars.map((b) => Math.max(b.theoretical, b.empirical ?? 0)));

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
    ctx.fillText(((maxVal / 3) * (3 - i) * 100).toFixed(0) + "%", pad.left - 6, y + 4);
  }

  // Bars
  const barW = Math.max(6, Math.min(32, (cw - (bars.length - 1) * 5) / bars.length));
  const gap = Math.max(3, (cw - barW * bars.length) / (bars.length + 1));

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const x = pad.left + gap + i * (barW + gap);

    // Theoretical (semi-transparent)
    const tH = Math.max(1, (b.theoretical / maxVal) * ch);
    const alpha = b.empirical !== null ? 0.35 : 0.7;
    ctx.fillStyle = isDark ? `rgba(59,130,246,${alpha})` : `rgba(59,130,246,${alpha})`;
    ctx.fillRect(x, pad.top + ch - tH, barW, tH);

    // Empirical (solid, with border)
    if (b.empirical !== null) {
      const eH = Math.max(1, (b.empirical / maxVal) * ch);
      ctx.fillStyle = isDark ? "#60a5fa" : "#2563eb";
      ctx.fillRect(x, pad.top + ch - eH, barW, eH);
      ctx.strokeStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, pad.top + ch - eH, barW, eH);
    }

    // X label
    ctx.fillStyle = isDark ? "#94a3b8" : "#71717a";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(b.label, x + barW / 2, H - pad.bottom + 14);
  }

  // Legend
  const ly = 10;
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(pad.left, ly, 8, 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = isDark ? "#94a3b8" : "#71717a";
  ctx.font = "9px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("理论泊松分布", pad.left + 12, ly + 8);

  ctx.fillStyle = "#2563eb";
  ctx.fillRect(pad.left + 100, ly, 8, 8);
  ctx.fillText("蒙特卡洛模拟", pad.left + 112, ly + 8);

  ctx.restore();
}

// ============================================================
//  Main Component
// ============================================================

const BATCH_SIZE = 300;
const MAX_TRIALS = 15000;

export default function ProbabilityPlayground() {
  const [lambda, setLambda] = useState(2.0);
  const [counts, setCounts] = useState<number[]>([]);
  const [trials, setTrials] = useState(0);
  const [running, setRunning] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [convergence, setConvergence] = useState<number | null>(null); // max error %

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const countsRef = useRef<number[]>([]);
  const trialsRef = useRef(0);

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
    setCounts([]);
    setTrials(0);
    countsRef.current = [];
    trialsRef.current = 0;
    setConvergence(null);
  }, [lambda]);

  const maxK = Math.max(8, Math.ceil(lambda * 2 + 4));
  const bars: BarData[] = [];
  const empiricalPMF = counts.map((c) => (trials > 0 ? c / trials : 0));

  for (let k = 0; k <= maxK; k++) {
    bars.push({
      label: String(k),
      theoretical: poissonPMF(k, lambda),
      empirical: trials > 0 ? (empiricalPMF[k] ?? null) : null,
    });
  }

  // Compute convergence metric
  const computeConvergence = useCallback((c: number[], t: number) => {
    if (t < 100) return null;
    let maxErr = 0;
    for (let k = 0; k <= maxK; k++) {
      const theoretical = poissonPMF(k, lambda);
      const empirical = (c[k] || 0) / t;
      const err = Math.abs(theoretical - empirical) * 100;
      if (err > maxErr) maxErr = err;
    }
    return Math.round(maxErr * 10) / 10;
  }, [lambda, maxK]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawChart(ctx, rect.width, rect.height, bars, isDark);
  }, [bars, isDark]);

  // Run simulation batches
  const runBatch = useCallback(() => {
    const c = [...countsRef.current];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const k = samplePoisson(lambda);
      if (k <= maxK) c[k] = (c[k] || 0) + 1;
    }
    const newTrials = trialsRef.current + BATCH_SIZE;
    countsRef.current = c;
    trialsRef.current = newTrials;
    setCounts([...c]);
    setTrials(newTrials);
    setConvergence(computeConvergence(c, newTrials));

    if (newTrials >= MAX_TRIALS) {
      setRunning(false);
    }
  }, [lambda, maxK, computeConvergence]);

  // Animation loop
  useEffect(() => {
    if (!running) return;
    const loop = () => {
      runBatch();
      if (trialsRef.current < MAX_TRIALS) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, runBatch]);

  const startSim = () => {
    if (trials >= MAX_TRIALS) {
      // Reset and restart
      setCounts([]);
      setTrials(0);
      countsRef.current = [];
      trialsRef.current = 0;
      setConvergence(null);
    }
    setRunning(true);
  };

  const stopSim = () => setRunning(false);

  const resetSim = () => {
    stopSim();
    setCounts([]);
    setTrials(0);
    countsRef.current = [];
    trialsRef.current = 0;
    setConvergence(null);
  };

  // Cleanup
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const progress = Math.min(100, (trials / MAX_TRIALS) * 100);
  const isComplete = trials >= MAX_TRIALS;
  const bestK = bars.reduce((b, bar) => bar.theoretical > b.prob ? { k: bar.label, prob: bar.theoretical } : b, { k: "0", prob: 0 });

  return (
    <div className="not-prose my-8 p-5 rounded-2xl bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800">
      <h3 className="text-base font-bold text-zinc-800 dark:text-slate-200">
        🎮 泊松游乐场
      </h3>
      <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
        拖动 λ 改变理论分布，点击"蒙特卡洛模拟"看随机试验的频率如何逼近理论值——这就是<strong>大数定律</strong>的视觉证明。
        每个批次掷 {BATCH_SIZE} 次骰子，最多运行 {MAX_TRIALS.toLocaleString()} 次。
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">
            λ = <strong>{lambda.toFixed(1)}</strong>（平均每单位发生次数）
          </label>
          <input
            type="range"
            min="0.3"
            max="5"
            step="0.1"
            value={lambda}
            onChange={(e) => setLambda(parseFloat(e.target.value))}
            disabled={running}
            className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-slate-700 appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 dark:text-slate-500 mt-0.5">
            <span>稀有 (λ=0.3)</span>
            <span>频繁 (λ=5.0)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!running && !isComplete && (
            <button onClick={startSim} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all">
              ▶ 蒙特卡洛模拟
            </button>
          )}
          {running && (
            <button onClick={stopSim} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-all">
              ⏸ 暂停
            </button>
          )}
          {isComplete && (
            <button onClick={startSim} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-all">
              🔄 重新模拟
            </button>
          )}
          {trials > 0 && (
            <button onClick={resetSim} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-slate-300 hover:bg-zinc-300 dark:hover:bg-slate-600 transition-all">
              重置
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {trials > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-slate-400 mb-1">
            <span>
              已模拟 <strong className="text-zinc-700 dark:text-slate-200">{trials.toLocaleString()}</strong> / {MAX_TRIALS.toLocaleString()} 次
              {isComplete && <span className="ml-2 text-green-600 dark:text-green-400 font-medium">✓ 完成</span>}
            </span>
            <span>
              理论峰值 k = <strong>{bestK.k}</strong>（概率 { (parseFloat(bestK.prob as any) * 100).toFixed(1) }%）
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="w-full bg-white dark:bg-slate-950 rounded-xl border border-zinc-100 dark:border-slate-800 overflow-hidden">
        <canvas ref={canvasRef} className="w-full" style={{ height: "280px", width: "100%" }} />
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-zinc-500 dark:text-slate-400">
        <span>🔵 浅色 = 理论泊松分布 P(k)=λᵏe⁻λ/k!</span>
        <span>🔷 深色 = 蒙特卡洛模拟频率</span>
        {convergence !== null && (
          <span className="text-zinc-600 dark:text-slate-300 font-medium">
            📐 最大偏差: {convergence}% {convergence < 2 ? "✓ 已收敛" : convergence < 5 ? "(接近中)" : "(偏差较大，继续模拟)"}
          </span>
        )}
      </div>

      {/* Completion summary */}
      {isComplete && (
        <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-xs text-zinc-600 dark:text-slate-300 leading-relaxed">
          <strong className="text-green-700 dark:text-green-400">🎯 模拟完成。</strong>{" "}
          经过 {MAX_TRIALS.toLocaleString()} 次随机试验，蒙特卡洛频率与泊松理论值的最大偏差仅{" "}
          <strong>{convergence}%</strong>。这就是<strong>大数定律</strong>：试验次数越多，经验频率越接近理论概率。
          泊松分布不是"猜的"——它是大量独立稀有事件反复发生后的<strong>必然收敛结果</strong>。
        </div>
      )}

      {/* Nothing yet state */}
      {trials === 0 && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-xs text-zinc-600 dark:text-slate-300">
          <strong>👆 试试：</strong>调 λ 选一个分布形状，点「▶ 蒙特卡洛模拟」看随机掷骰子如何逐渐还原理论曲线。
          建议先从 λ=2 开始，观察 k=2 附近的理论峰值如何在模拟中浮现。
        </div>
      )}
    </div>
  );
}
