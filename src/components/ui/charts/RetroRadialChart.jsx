"use client";

import React from "react";

/**
 * Retro-neon SVG Radial/Donut Chart for Learning Curve Stages (25%, 50%, 75%, 100%)
 * @param {{ stageCounts: { p25: number, p50: number, p75: number, p100: number, firstTry: number } }} props
 */
export function RetroRadialChart({ stageCounts = {} }) {
  const { p25 = 0, p50 = 0, p75 = 0, p100 = 0, firstTry = 0 } = stageCounts;
  const total = p25 + p50 + p75 + p100 + firstTry;

  const STAGES = [
    { key: "firstTry", label: "Tek Seferde (Sık Görünmez)", count: firstTry, color: "#22d3ee" },
    { key: "p100", label: "Tamamlanan (%100)", count: p100, color: "#22c55e" },
    { key: "p75", label: "İleri Aşama (%75)", count: p75, color: "#eab308" },
    { key: "p50", label: "Orta Aşama (%50)", count: p50, color: "#f97316" },
    { key: "p25", label: "Başlangıç (%25)", count: p25, color: "#ef4444" },
  ];

  const size = 150;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const segments = STAGES.map((s) => {
    const pct = total > 0 ? s.count / total : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += pct * circumference;
    return { ...s, strokeDasharray, strokeDashoffset, pct: Math.round(pct * 100) };
  });

  return (
    <div className="w-full bg-slate-950/80 border border-amber-500/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.08)] flex flex-col sm:flex-row items-center gap-5 overflow-hidden">
      {/* Donut Graphic */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {total > 0 ? (
            segments.map((seg) => (
              <circle
                key={seg.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            ))
          ) : (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#334155"
              strokeWidth={strokeWidth}
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black font-mono text-white">{total}</span>
          <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider">
            EĞRİ KELİME
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full min-w-0 flex flex-col gap-1.5">
        <h4 className="text-[11px] font-mono font-bold text-amber-400 tracking-wider uppercase mb-1 flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          ÖĞRENME EĞRİSİ DAĞILIMI
        </h4>
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-mono gap-2 min-w-0"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-gray-300 text-[11px] truncate">{seg.label}</span>
            </div>
            <div className="flex items-center gap-1 font-bold flex-shrink-0 text-right">
              <span className="text-white text-[11px]">{seg.count}</span>
              <span className="text-gray-400 text-[10px]">({seg.pct}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
