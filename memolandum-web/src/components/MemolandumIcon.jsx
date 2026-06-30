"use client";

import React from 'react';

export default function MemolandumIcon({ size = 80, className = '' }) {
  return (
    <div 
      className={`memolandum-icon-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        background: '#0f172a',
        borderRadius: size * 0.2, // Proportional border radius (e.g., 16px for 80px)
        padding: size * 0.1, // Proportional padding (e.g., 8px for 80px)
        boxSizing: 'border-box'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="memolandum-branding-icon" fill="none">
        <defs>
          {/* Subliminal Aura (Bilinçaltı Derinlik Parlaması) */}
          <radialGradient id="subliminalAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0"/>
          </radialGradient>
          
          {/* Siber Teknolojik Renk Geçişi (Sonsuzluk Akışı) */}
          <linearGradient id="cyberFlowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Arka Plan Derinlik Katmanı */}
        <circle cx="50" cy="50" r="45" fill="url(#subliminalAura)" />

        {/* Ana Gövde: Kesintisiz Hatlarla Çizilmiş Fütüristik "M" Harfi */}
        <path className="main-matrix-path" 
              d="M22 72 V35 L42 53 L50 44 L58 53 L78 35 V72" 
              stroke="url(#cyberFlowGradient)" 
              strokeWidth="5.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" />
              
        {/* Merkezdeki Gizli Subliminal Odak Noktası (Parlayan Bilgi Çekirdeği/Nöron) */}
        <circle className="subliminal-core" cx="50" cy="28" r="3.5" fill="#38bdf8" />
      </svg>
      <style jsx>{`
        .memolandum-branding-icon {
          width: 100%;
          height: 100%;
          overflow: visible;
          animation: subliminalPulse 3.5s infinite ease-in-out;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .subliminal-core {
          filter: drop-shadow(0 0 4px #38bdf8) drop-shadow(0 0 10px #38bdf8);
        }

        .memolandum-icon-wrapper:hover .memolandum-branding-icon {
          transform: scale(1.06) rotate(3deg);
          filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.6)) 
                  drop-shadow(0 0 25px rgba(168, 85, 247, 0.4));
        }

        @keyframes subliminalPulse {
          0% {
            transform: scale(0.96);
            filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.3));
            opacity: 0.85;
          }
          50% {
            transform: scale(1.02);
            filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.7)) 
                    drop-shadow(0 0 28px rgba(168, 85, 247, 0.5));
            opacity: 1;
          }
          100% {
            transform: scale(0.96);
            filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.3));
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}
