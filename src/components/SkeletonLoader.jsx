import React from 'react';

export default function SkeletonLoader({ gameType }) {
  return (
    <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center bg-dark-900 z-50">
      <div className="relative w-24 h-24 mb-8">
        {/* Spinner */}
        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        
        {/* Game Icon / Logo Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">
          {gameType === 'shooter' && '🚀'}
          {gameType === 'breakout' && '🧱'}
          {gameType === 'highway' && '🏎️'}
          {gameType === 'invaders' && '👾'}
          {gameType === 'wordascent' && '🧗'}
          {gameType === 'worddrop' && '📦'}
          {!gameType && '🎮'}
        </div>
      </div>
      
      {/* Loading Text */}
      <h2 className="text-xl font-bold text-cyan-400 animate-pulse tracking-widest">
        OYUN YÜKLENİYOR...
      </h2>
      <p className="text-sm text-gray-500 mt-2">
        Lütfen bekleyin, oyun motoru başlatılıyor
      </p>
    </div>
  );
}
