"use client";

/**
 * Mini line chart showing overall score progression across refinements.
 * Uses Canvas API directly — no charting library needed.
 */

import { useRef, useEffect } from "react";

export interface ScoreSnapshot {
  timestamp: number;
  overall: number;
  verdict: string;
}

interface Props {
  history: ScoreSnapshot[];
}

export default function ScoreHistoryChart({ history }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, w, h);

    const padding = { top: 12, right: 12, bottom: 20, left: 28 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Y-axis: 0-10
    const yMin = 0;
    const yMax = 10;
    const toY = (val: number) =>
      padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
    const toX = (i: number) =>
      history.length === 1
        ? padding.left + chartW / 2
        : padding.left + (i / (history.length - 1)) * chartW;

    // Grid lines
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--border") || "#e4e4e7";
    ctx.lineWidth = 0.5;
    for (let y = 0; y <= 10; y += 2.5) {
      ctx.beginPath();
      ctx.moveTo(padding.left, toY(y));
      ctx.lineTo(padding.left + chartW, toY(y));
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--muted") || "#71717a";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const y of [0, 5, 10]) {
      ctx.fillText(String(y), padding.left - 6, toY(y));
    }

    // Line
    const accentColor = getComputedStyle(canvas).getPropertyValue("--accent") || "#f97316";
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    history.forEach((snap, i) => {
      const x = toX(i);
      const y = toY(snap.overall);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    history.forEach((snap, i) => {
      const x = toX(i);
      const y = toY(snap.overall);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // X-axis label
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--muted") || "#71717a";
    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    history.forEach((snap, i) => {
      const x = toX(i);
      const label = i === 0 ? "Initial" : `v${i + 1}`;
      ctx.fillText(label, x, padding.top + chartH + 6);
    });
  }, [history]);

  if (history.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="text-xs font-medium text-[color:var(--muted)] mb-2 uppercase tracking-wide">
        Score History
      </h4>
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3">
        <canvas
          ref={canvasRef}
          className="w-full h-24"
          style={{
            // Pass CSS vars to the canvas drawing code via computed style.
            // @ts-expect-error CSS custom properties
            "--accent": "var(--accent)",
            "--muted": "var(--muted)",
            "--border": "var(--border)",
          }}
        />
        {history.length === 1 && (
          <p className="text-xs text-center text-[color:var(--muted)] mt-1">
            Re-score your idea to see how your score evolves
          </p>
        )}
      </div>
    </div>
  );
}
