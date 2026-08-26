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
      <img 
        src="/icons/seffaf_logo.png" 
        alt="Memolandum Logo" 
        className="memolandum-branding-icon"
      />
      <style jsx>{`
        .memolandum-branding-icon {
          width: 100%;
          height: 100%;
          object-fit: contain;
          animation: subliminalPulse 3.5s infinite ease-in-out;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
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

