"use client";

import React from "react";

/**
 * Retro-neon SVG Line & Area Chart for Daily Practice History
 * @param {{ data: Array<{ label: string, correct: number, wrong: number }> }} props
 */
export function RetroLineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-500 font-mono text-sm border border-slate-800/80 rounded-2xl bg-slate-950/40">
        HENÜZ AKTİVİTE VERİSİ YOK
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const padding = { top: 30, right: 30, bottom: 40, left: 40 };

  const maxVal = Math.max(
    10,
    ...data.flatMap((d) => [d.correct || 0, d.wrong || 0])
  );

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const pointsCorrect = data.map((d, i) => {
    const x = padding.left + (i / Math.max(1, data.length - 1)) * innerW;
    const y = padding.top + innerH - ((d.correct || 0) / maxVal) * innerH;
    return { x, y, val: d.correct || 0, label: d.label };
  });

  const pathCorrect = pointsCorrect.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
    ""
  );

  const areaCorrect = `${pathCorrect} L ${
    padding.left + innerW
  } ${padding.top + innerH} L ${padding.left} ${padding.top + innerH} Z`;

  return (
    <div className="w-full bg-slate-950/80 border border-cyan-500/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.08)] flex flex-col gap-3">
      <div className="flex justify-between items-center px-1">
        <h4 className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          SON 7 GÜNLÜK ÇALIŞMA PERFORMANSI
        </h4>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-1 rounded-full bg-cyan-400" /> DOĞRU CEVAP
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[300px] overflow-visible"
        >
          <defs>
            <linearGradient id="correctGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = padding.top + innerH * ratio;
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerW}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaCorrect} fill="url(#correctGrad)" />

          {/* Line Path */}
          <path
            d={pathCorrect}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />

          {/* Points */}
          {pointsCorrect.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#090d16"
                stroke="#22d3ee"
                strokeWidth="2.5"
              />
              <text
                x={p.x}
                y={p.y - 10}
                fill="#22d3ee"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {p.val}
              </text>
              {/* X Labels */}
              <text
                x={p.x}
                y={height - 12}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
