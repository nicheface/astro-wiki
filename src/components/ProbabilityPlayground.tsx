/**
 * ProbabilityPlayground.tsx — Interactive Poisson & Monte Carlo Explorer
 * No external charting library — pure Canvas + React.
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
//  Poisson PMF
// ============================================================

function poissonPMF(k: number, lambda: number): number {
  if (k < 0 || lambda <= 0) return 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ============================================================
//  Canvas chart renderer
// ============================================================

interface Bar {
  label: string;
  theoretical: number;
  empirical: number | null;
  color: string;
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bars: Bar[],
  isDark: boolean,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  const W = width;
  const H = height;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  const maxVal = Math.max(0.01, ...bars.map((b) => Math.max(b.theoretical, b.empirical ?? 0)));

  // Grid lines
  ctx.strokeStyle = isDark ? "rgba(148,163,184,0.15)" : "rgba(161,161,170,0.2)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (ch / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();

    // Y-axis label
    ctx.fillStyle = isDark ? "#94a3b8" : "#a1a1aa";
    ctx.font = "10px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(((maxVal / 4) * (4 - i) * 100).toFixed(0) + "%", pad.left - 6, y + 4);
  }

  // Bars
  const barGap = 4;
  const totalGaps = (bars.length - 1) * barGap;
  const barW = Math.min(40, (cw - totalGaps) / bars.length);

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const x = pad.left + i * (barW + barGap);

    // Theoretical bar
    const th = (b.theoretical / maxVal) * ch;
    ctx.fillStyle = b.color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x, pad.top + ch - th, barW, th);

    // Empirical bar (overlaid if exists)
    if (b.empirical !== null && b.empirical > 0) {
      const eh = (b.empirical / maxVal) * ch;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 1;
      ctx.fillRect(x, pad.top + ch - eh, barW, eh);
      // border on empirical
      ctx.strokeStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, pad.top + ch - eh, barW, eh);
    }
    ctx.globalAlpha = 1;

    // X-axis label
    ctx.fillStyle = isDark ? "#94a3b8" : "#71717a";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(b.label, x + barW / 2, H - pad.bottom + 16);
  }

  // Legend
  ctx.fillStyle = isDark ? "#cbd5e1" : "#52525b";
  ctx.font = "10px system-ui";
  ctx.textAlign = "left";
  // theoretical
  ctx.fillStyle = bars[0]?.color || "#3b82f6";
  ctx.globalAlpha = 0.7;
  ctx.fillRect(pad.left, 8, 10, 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = isDark ? "#94a3b8" : "#71717a";
  ctx.fillText("理论值", pad.left + 14, 17);

  // empirical
  ctx.fillStyle = bars[0]?.color || "#3b82f6";
  ctx.fillRect(pad.left + 80, 8, 10, 10);
  ctx.fillText("模拟值", pad.left + 94, 17);

  ctx.restore();
}

// ============================================================
//  Main Component
// ============================================================

export default function ProbabilityPlayground() {
  const [lambda, setLambda] = useState(2.0);
  const [empirical, setEmpirical] = useState<number[]>([]);
  const [trials, setTrials] = useState(0);
  const [running, setRunning] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dark mode detection
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Build bars
  const maxK = Math.max(8, Math.ceil(lambda * 2 + 3));
  const bars: Bar[] = [];
  for (let k = 0; k <= maxK; k++) {
    bars.push({
      label: String(k),
      theoretical: poissonPMF(k, lambda),
      empirical: empirical[k] ?? null,
      color: "#3b82f6",
    });
  }

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawChart(ctx, rect.width, rect.height, bars, isDark);
  }, [bars, isDark]);

  // Handle resize
  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawChart(ctx, rect.width, rect.height, bars, isDark);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bars, isDark]);

  // Monte Carlo simulation
  const runBatch = useCallback(() => {
    const newEmpirical = [...(empirical.length > 0 ? empirical : new Array(maxK + 1).fill(0))];
    const N = 500; // simulations per batch
    for (let i = 0; i < N; i++) {
      // Inverse transform sampling from Poisson
      const u = Math.random();
      let cum = 0;
      let k = 0;
      while (cum < u && k < 50) {
        cum += poissonPMF(k, lambda);
        if (cum < u) k++;
      }
      if (k <= maxK) newEmpirical[k] = (newEmpirical[k] || 0) + 1;
    }
    setEmpirical(newEmpirical);
    setTrials((t) => t + N);
  }, [empirical, lambda, maxK]);

  const startSim = () => {
    setRunning(true);
    timerRef.current = setInterval(runBatch, 80);
  };

  const stopSim = () => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetSim = () => {
    stopSim();
    setEmpirical([]);
    setTrials(0);
  };

  // Compute empirical PMF for display
  const empiricalPMF = empirical.map((v) => (trials > 0 ? v / trials : 0));

  // Update bars with empirical data
  const displayBars: Bar[] = bars.map((b, i) => ({
    ...b,
    empirical: trials > 0 ? empiricalPMF[i] : null,
  }));

  // Redraw with empirical data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawChart(ctx, rect.width, rect.height, displayBars, isDark);
  }, [displayBars, isDark]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Probability highlight: most likely k
  const bestK = bars.reduce((best, b) => (b.theoretical > best.prob ? { k: parseInt(b.label), prob: b.theoretical } : best), { k: 0, prob: 0 });

  return (
    <div ref={containerRef} className="not-prose my-8 p-5 rounded-2xl bg-zinc-50 dark:bg-slate-900 border border-zinc-100 dark:border-slate-800">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-slate-200 mb-4">
        🎮 泊松游乐场
      </h3>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-zinc-500 dark:text-slate-400 mb-1">
            λ (lambda) = {lambda.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.3"
            max="5"
            step="0.1"
            value={lambda}
            onChange={(e) => {
              setLambda(parseFloat(e.target.value));
              if (!running) { setEmpirical([]); setTrials(0); }
            }}
            disabled={running}
            className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-slate-700 appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 dark:text-slate-500 mt-0.5">
            <span>0.3 (稀有)</span>
            <span>5.0 (频繁)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!running ? (
            <button
              onClick={startSim}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
            >
              ▶ 蒙特卡洛模拟
            </button>
          ) : (
            <button
              onClick={stopSim}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-all"
            >
              ⏸ 暂停
            </button>
          )}
          <button
            onClick={resetSim}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-slate-300 hover:bg-zinc-300 dark:hover:bg-slate-600 transition-all"
          >
            重置
          </button>
        </div>
      </div>

      {/* Trial counter */}
      {trials > 0 && (
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="text-zinc-500 dark:text-slate-400">
            已模拟 <strong className="text-zinc-700 dark:text-slate-200">{trials.toLocaleString()}</strong> 次
          </span>
          <span className="text-zinc-400 dark:text-slate-500">
            理论最大值在 k = <strong>{bestK.k}</strong>（概率 { (bestK.prob * 100).toFixed(1) }%）
          </span>
        </div>
      )}

      {/* Canvas chart */}
      <div className="w-full bg-white dark:bg-slate-950 rounded-xl border border-zinc-100 dark:border-slate-800 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-[260px]"
          style={{ width: "100%", height: "260px" }}
        />
      </div>

      {/* Explanation */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-500 dark:text-slate-400 leading-relaxed">
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800">
          <strong className="text-zinc-700 dark:text-slate-300">🔵 半透明柱</strong> = 理论泊松概率
          <br />
          公式: P(k) = λᵏ e⁻<sup>λ</sup> / k!
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800">
          <strong className="text-zinc-700 dark:text-slate-300">🟦 实心柱</strong> = 蒙特卡洛模拟频率
          <br />
          次数越多，越贴近理论值
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800">
          <strong className="text-zinc-700 dark:text-slate-300">🎯 试试</strong>
          <br />
          调 λ → 点模拟 → 看频率收敛到理论
        </div>
      </div>
    </div>
  );
}
