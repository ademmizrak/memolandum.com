"use client";

import React from "react";

/**
 * Retro-neon SVG Bar/Column Chart for Word Strength Distribution (Levels 1 to 5)
 * @param {{ stats: Object<number, number> }} props
 */
export function RetroBarChart({ stats = {} }) {
  const STRENGTH_META = {
    1: { label: "Yeni", color: "#ef4444", emoji: "🔴" },
    2: { label: "Öğreniyor", color: "#f97316", emoji: "🟠" },
    3: { label: "Orta", color: "#eab308", emoji: "🟡" },
    4: { label: "İyi", color: "#22c55e", emoji: "🟢" },
    5: { label: "Usta", color: "#22d3ee", emoji: "💎" },
  };

  const width = 500;
  const height = 220;
  const padding = { top: 30, right: 20, bottom: 45, left: 40 };

  const values = [1, 2, 3, 4, 5].map((str) => Number(stats[str]) || 0);
  const maxVal = Math.max(5, ...values);

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const barWidth = (innerW / 5) * 0.55;
  const groupWidth = innerW / 5;

  return (
    <div className="w-full bg-slate-950/80 border border-purple-500/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.08)] flex flex-col gap-3 overflow-hidden">
      <div className="flex justify-between items-center gap-2 px-1 min-w-0">
        <h4 className="text-[11px] font-mono font-bold text-purple-400 tracking-wider uppercase flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
          KELİME GÜCÜ DAĞILIMI
        </h4>
        <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
          TOPLAM: {values.reduce((a, b) => a + b, 0)} KELİME
        </span>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
        >
          <defs>
            {[1, 2, 3, 4, 5].map((str) => (
              <linearGradient
                key={str}
                id={`barGrad_${str}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={STRENGTH_META[str].color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={STRENGTH_META[str].color} stopOpacity="0.2" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
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

          {/* Bars */}
          {[1, 2, 3, 4, 5].map((str, idx) => {
            const val = Number(stats[str]) || 0;
            const barH = (val / maxVal) * innerH;
            const x = padding.left + idx * groupWidth + (groupWidth - barWidth) / 2;
            const y = padding.top + innerH - barH;
            const meta = STRENGTH_META[str];

            const textY = Math.max(16, y - 6);

            return (
              <g key={str} className="group">
                {/* Bar rectangle */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(4, barH)}
                  rx="6"
                  fill={`url(#barGrad_${str})`}
                  stroke={meta.color}
                  strokeWidth="1.5"
                />

                {/* Value on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={textY}
                  fill={meta.color}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {val}
                </text>

                {/* Label under bar */}
                <text
                  x={x + barWidth / 2}
                  y={height - 12}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {meta.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
