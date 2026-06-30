import React from 'react';

export const PauseScreen = ({ onResume, onRestart, onMainMenu }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 pointer-events-auto backdrop-blur-md z-50">
    <h2 className="text-4xl text-cyan-400 font-bold mb-8 tracking-widest" style={{ textShadow: '0 0 10px cyan' }}>SYSTEM PAUSED</h2>
    <div className="flex flex-col space-y-4 w-64">
      <button 
        onClick={onResume}
        className="px-8 py-3 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_15px_cyan]"
      >
        RESUME
      </button>
      <button 
        onClick={onRestart}
        className="px-8 py-3 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-all shadow-[0_0_15px_#ff0055]"
      >
        RESTART SECTOR
      </button>
      <button 
        onClick={onMainMenu}
        className="px-8 py-3 border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all shadow-[0_0_15px_#a855f7]"
      >
        MAIN MENU
      </button>
    </div>
  </div>
);

export const GameOverScreen = ({ score, onRestart, onMainMenu, message = "SHIELDS DEPLETED", children }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 pointer-events-auto backdrop-blur-md z-50">
    <h2 className="text-5xl text-pink-500 font-bold mb-2 tracking-widest" style={{ textShadow: '0 0 15px #ff0055' }}>GAME OVER</h2>
    <div className="text-white text-xs mb-6">{message}</div>
    <div className="text-xl text-cyan-300 mb-6">Score: {score}</div>
    
    {children && <div className="mb-6 w-full max-w-md">{children}</div>}

    <div className="flex flex-col space-y-4 w-64">
      <button 
        onClick={onRestart}
        className="px-8 py-3 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-all shadow-[0_0_15px_#ff0055]"
      >
        RESTART SECTOR
      </button>
      <button 
        onClick={onMainMenu}
        className="px-8 py-3 border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all shadow-[0_0_15px_#a855f7]"
      >
        MAIN MENU
      </button>
    </div>
  </div>
);

export const VictoryScreen = ({ score, onNextLevel, onMainMenu, children }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 pointer-events-auto backdrop-blur-md z-50">
    <h2 className="text-5xl text-green-400 font-bold mb-4 tracking-widest" style={{ textShadow: '0 0 15px #39ff14' }}>SECTOR CLEARED</h2>
    <div className="text-xl text-cyan-300 mb-8">Score: {score}</div>
    
    {children && <div className="mb-8 w-full max-w-md flex flex-col items-center">{children}</div>}

    <div className="flex flex-col space-y-4 w-64">
      {onNextLevel && (
        <button 
          onClick={onNextLevel}
          className="px-8 py-3 border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-all shadow-[0_0_15px_#39ff14]"
        >
          NEXT SECTOR
        </button>
      )}
      <button 
        onClick={onMainMenu}
        className="px-8 py-3 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_15px_cyan]"
      >
        MAIN MENU
      </button>
    </div>
  </div>
);
