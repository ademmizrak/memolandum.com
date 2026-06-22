const fs = require('fs');
let content = fs.readFileSync('D:/000Memorade/index.html', 'utf8');

// 1. Add overflow-x-auto to main area
content = content.replace(
  '<div className="flex-grow flex flex-row w-full overflow-hidden">',
  '<div className="flex-grow flex flex-row w-full overflow-x-auto custom-scrollbar">'
);

// 2. Change left column width
content = content.replace(
  '<div className="w-[320px] shrink-0 bg-[#0d1222] border-r border-gray-800 pointer-events-auto overflow-y-auto custom-scrollbar p-6 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col gap-3">',
  '<div className="w-[280px] shrink-0 bg-[#0d1222] border-r border-gray-800 pointer-events-auto overflow-y-auto custom-scrollbar p-6 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col gap-3">'
);

// 3. Update button mapping
const buttonOld = `{levels.map(lvl => (
                <button
                  key={lvl.id}
                  onClick={() => handleLevelSelect(lvl.id)}
                  className={\`w-full text-left p-4 rounded-xl border transition-all \${activeCategory === lvl.id ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#111625] border-gray-800 text-gray-300 hover:border-emerald-500/30'}\`}
                >
                  <div className="font-bold text-sm tracking-wide">{lvl.name}</div>
                </button>
              ))}`;
const buttonNew = `{levels.map(lvl => (
                <button
                  key={lvl.id}
                  onClick={() => handleLevelSelect(lvl.id)}
                  className={\`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1 \${activeCategory === lvl.id ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#111625] border-gray-800 text-gray-300 hover:border-emerald-500/30'}\`}
                >
                  <div className="font-bold text-sm tracking-wide">{lvl.label || lvl.name}</div>
                  {lvl.desc && <div className="text-[10px] text-gray-500 font-medium leading-tight">{lvl.desc}</div>}
                </button>
              ))}`;
content = content.replace(buttonOld, buttonNew);

// 4. Add ref to middleCol
content = content.replace(
  '<div className="flex-grow relative pointer-events-none">',
  '<div className="flex-grow relative pointer-events-none" ref={middleColRef}>'
);

// 5. Change right column width
content = content.replace(
  '<div className="w-[320px] shrink-0 bg-[#0d1222] border-l border-gray-800 pointer-events-auto overflow-y-auto custom-scrollbar p-6 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col gap-3">',
  '<div className="w-[280px] shrink-0 bg-[#0d1222] border-l border-gray-800 pointer-events-auto overflow-y-auto custom-scrollbar p-6 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col gap-3">'
);

fs.writeFileSync('D:/000Memorade/index.html', content, 'utf8');
