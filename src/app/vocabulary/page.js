"use client";
import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { saveWordToCloud } from "../../lib/firebase/authService";
import { auth } from "../../lib/firebase/config";

const STRENGTH_CONFIG = {
  1: { label: "Yeni",   color: "#ef4444", glow: "rgba(239,68,68,0.3)",    emoji: "🔴" },
  2: { label: "Zayif",  color: "#f97316", glow: "rgba(249,115,22,0.3)",   emoji: "🟠" },
  3: { label: "Orta",   color: "#eab308", glow: "rgba(234,179,8,0.3)",    emoji: "🟡" },
  4: { label: "Iyi",    color: "#22c55e", glow: "rgba(34,197,94,0.3)",    emoji: "🟢" },
  5: { label: "Usta",   color: "#22d3ee", glow: "rgba(34,211,238,0.3)",   emoji: "💎" },
};

const LANG_FLAGS = {
  Spanish:"🇪🇸",French:"🇫🇷",Almanca:"🇩🇪",Italy:"🇮🇹",
  Russian:"🇷🇺",Portugal:"🇧🇷",Japan:"🇯🇵",Korean:"🇰🇷",
  Arabic:"🇸🇦",Greek:"🇬🇷",Chinesee:"🇨🇳",
};

// ─── Review Mode ────────────────────────────────────────────────────────────
function ReviewMode({ words, onExit, onStrengthUpdate }) {
  const [idx, setIdx]       = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone]     = useState(false);
  const [results, setResults] = useState([]);
  const audioRef = useRef(null);

  const word = words[idx];

  const handlePlay = () => {
    const url = word?.audioUrl;
    if (!url || !audioRef.current) return;
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
  };

  const handleRate = (knew) => {
    const newStrength = knew
      ? Math.min(5, (word.strength || 1) + 1)
      : Math.max(1, (word.strength || 1) - 1);
    onStrengthUpdate(word.id, newStrength);
    setResults(prev => [...prev, { word, knew }]);
    if (idx + 1 >= words.length) { setDone(true); }
    else { setIdx(i => i + 1); setFlipped(false); }
  };

  if (done) {
    const correct = results.filter(r => r.knew).length;
    const pct = Math.round((correct / results.length) * 100);
    return (
      <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,padding:"40px 20px"}}>
        <div style={{fontSize:64}}>{pct>=80?"🏆":pct>=50?"💪":"📚"}</div>
        <h2 style={{color:"#22d3ee",fontSize:28,fontWeight:700,margin:0}}>Tekrar Tamamlandi!</h2>
        <div style={{display:"flex",gap:32,marginTop:8}}>
          <div style={{textAlign:"center"}}><div style={{color:"#22c55e",fontSize:32,fontWeight:800}}>{correct}</div><div style={{color:"#6b7280",fontSize:13}}>Dogru</div></div>
          <div style={{textAlign:"center"}}><div style={{color:"#ef4444",fontSize:32,fontWeight:800}}>{results.length-correct}</div><div style={{color:"#6b7280",fontSize:13}}>Yanlis</div></div>
          <div style={{textAlign:"center"}}><div style={{color:"#c084fc",fontSize:32,fontWeight:800}}>{pct}%</div><div style={{color:"#6b7280",fontSize:13}}>Basari</div></div>
        </div>
        <button onClick={onExit} style={{marginTop:16,padding:"12px 32px",background:"linear-gradient(135deg,#22d3ee,#6366f1)",border:"none",borderRadius:12,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>
          Kasaya Don
        </button>
      </div>
    );
  }

  const cfg = STRENGTH_CONFIG[word?.strength || 1];
  return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,padding:"40px 20px"}}>
      <audio ref={audioRef} />
      <div style={{display:"flex",alignItems:"center",gap:12,color:"#6b7280",fontSize:14}}>
        <span>{LANG_FLAGS[word?.language]||"🌐"} {word?.language}</span>
        <span>•</span><span>{idx+1} / {words.length}</span>
        <span>•</span><span style={{color:cfg.color}}>{cfg.emoji} {cfg.label}</span>
      </div>
      <div style={{width:"100%",maxWidth:480,height:4,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(idx/words.length)*100}%`,background:"linear-gradient(90deg,#22d3ee,#6366f1)",transition:"width 0.3s"}} />
      </div>
      <div
        onClick={() => { setFlipped(true); if (!flipped) handlePlay(); }}
        style={{width:"100%",maxWidth:480,minHeight:220,background:"linear-gradient(135deg,rgba(22,211,238,0.06),rgba(99,102,241,0.06))",border:`1.5px solid ${flipped?cfg.color+"60":"rgba(255,255,255,0.08)"}`,borderRadius:20,padding:40,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,transition:"border-color 0.3s",boxShadow:flipped?`0 0 32px ${cfg.glow}`:"none",position:"relative"}}
      >
        {!flipped&&<div style={{position:"absolute",top:14,right:14,color:"#374151",fontSize:12}}>Gormek icin dokun</div>}
        <div style={{fontSize:28,fontWeight:800,color:"#e2e8f0",textAlign:"center",letterSpacing:1}}>{word?.english}</div>
        {flipped&&(
          <>
            <div style={{width:40,height:1,background:"rgba(255,255,255,0.1)"}} />
            <div style={{fontSize:22,fontWeight:700,color:cfg.color,textAlign:"center"}}>{word?.turkish}</div>
            {word?.audioUrl&&(
              <button onClick={e=>{e.stopPropagation();handlePlay();}} style={{marginTop:8,background:"rgba(34,211,238,0.1)",border:"1px solid rgba(34,211,238,0.2)",borderRadius:8,padding:"6px 16px",color:"#22d3ee",cursor:"pointer",fontSize:13,fontWeight:600}}>🔊 Dinle</button>
            )}
          </>
        )}
      </div>
      {flipped?(
        <div style={{display:"flex",gap:16}}>
          <button onClick={()=>handleRate(false)} style={{padding:"14px 32px",background:"rgba(239,68,68,0.15)",border:"1.5px solid rgba(239,68,68,0.4)",borderRadius:12,color:"#ef4444",fontSize:15,fontWeight:700,cursor:"pointer"}}>✗ Bilmedim</button>
          <button onClick={()=>handleRate(true)} style={{padding:"14px 32px",background:"rgba(34,197,94,0.15)",border:"1.5px solid rgba(34,197,94,0.4)",borderRadius:12,color:"#22c55e",fontSize:15,fontWeight:700,cursor:"pointer"}}>✓ Bildim</button>
        </div>
      ):(
        <div style={{color:"#4b5563",fontSize:13}}>Karti cevir, sonra degerlendir</div>
      )}
      <button onClick={onExit} style={{background:"none",border:"none",color:"#6b7280",fontSize:13,cursor:"pointer",textDecoration:"underline"}}>Tekrari Bitir</button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function VocabularyPage() {
  const { vocabularyVault, updateWordStrength, isGuest } = useMemolandumStore();
  const [filterLang, setFilterLang]         = useState("all");
  const [filterStrength, setFilterStrength] = useState("all");
  const [sortBy, setSortBy]                 = useState("lastSeen");
  const [searchQ, setSearchQ]               = useState("");
  const [reviewMode, setReviewMode]         = useState(false);
  const [reviewWords, setReviewWords]       = useState([]);

  const allWords  = useMemo(()=>Object.values(vocabularyVault||{}),[vocabularyVault]);
  const languages = useMemo(()=>[...new Set(allWords.map(w=>w.language).filter(Boolean))]    ,[allWords]);

  const filtered = useMemo(()=>{
    let ws = allWords;
    if(filterLang!=="all")      ws=ws.filter(w=>w.language===filterLang);
    if(filterStrength!=="all")  ws=ws.filter(w=>(w.strength||1)===Number(filterStrength));
    if(searchQ.trim()){
      const q=searchQ.toLowerCase();
      ws=ws.filter(w=>w.english?.toLowerCase().includes(q)||w.turkish?.toLowerCase().includes(q));
    }
    return ws.sort((a,b)=>{
      if(sortBy==="lastSeen")       return (b.lastSeen||0)-(a.lastSeen||0);
      if(sortBy==="strength_asc")   return (a.strength||1)-(b.strength||1);
      if(sortBy==="strength_desc")  return (b.strength||1)-(a.strength||1);
      return a.english?.localeCompare(b.english||"")||0;
    });
  },[allWords,filterLang,filterStrength,searchQ,sortBy]);

  const stats = useMemo(()=>{
    const s={1:0,2:0,3:0,4:0,5:0};
    allWords.forEach(w=>{s[w.strength||1]=(s[w.strength||1]||0)+1;});
    return s;
  },[allWords]);

  const handleStrengthUpdate = async (wordId, strength) => {
    updateWordStrength(wordId, strength);
    const uid = auth.currentUser?.uid;
    if(uid){
      const word = (vocabularyVault||{})[wordId];
      if(word) await saveWordToCloud(uid, wordId, {...word, strength, lastSeen:Date.now()});
    }
  };

  const startReview = (words) => {
    const shuffled = [...words].sort(()=>Math.random()-0.5);
    setReviewWords(shuffled);
    setReviewMode(true);
  };

  if(reviewMode){
    return(
      <div style={{minHeight:"100vh",background:"#0a0a0a",fontFamily:"Inter,sans-serif"}}>
        <Header/>
        <div style={{maxWidth:600,margin:"0 auto",padding:"24px 16px"}}>
          <button onClick={()=>setReviewMode(false)} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:14,marginBottom:8,padding:0}}>← Kelime Kasasina Don</button>
          <ReviewMode words={reviewWords} onExit={()=>setReviewMode(false)} onStrengthUpdate={handleStrengthUpdate}/>
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0a",fontFamily:"Inter,sans-serif",color:"#e2e8f0"}}>
      <Header/>
      <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 16px"}}>

        {/* Header */}
        <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:32}}>
          <div>
            <h1 style={{fontSize:32,fontWeight:800,margin:0,background:"linear-gradient(135deg,#22d3ee,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              💎 Kelime Kasasi
            </h1>
            <p style={{color:"#6b7280",marginTop:6,fontSize:15}}>{allWords.length} kelime ogrenildi · Tekrar ederek kalici hale getir</p>
          </div>
          {allWords.length>0&&(
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button
                onClick={()=>startReview(filtered.filter(w=>(w.strength||1)<=2))}
                disabled={filtered.filter(w=>(w.strength||1)<=2).length===0}
                style={{padding:"10px 20px",background:"rgba(239,68,68,0.15)",border:"1.5px solid rgba(239,68,68,0.4)",borderRadius:10,color:"#ef4444",fontWeight:700,cursor:"pointer",fontSize:14,opacity:filtered.filter(w=>(w.strength||1)<=2).length===0?0.4:1}}
              >🔴 Zaziflari Tekrar Et</button>
              <button
                onClick={()=>startReview(filtered)}
                style={{padding:"10px 20px",background:"linear-gradient(135deg,rgba(34,211,238,0.15),rgba(99,102,241,0.15))",border:"1.5px solid rgba(34,211,238,0.3)",borderRadius:10,color:"#22d3ee",fontWeight:700,cursor:"pointer",fontSize:14}}
              >▶ Tumunu Tekrar Et</button>
            </div>
          )}
        </div>

        {/* Strength Stats */}
        {allWords.length>0&&(
          <div style={{display:"flex",gap:10,marginBottom:28,flexWrap:"wrap"}}>
            {Object.entries(STRENGTH_CONFIG).map(([str,cfg])=>(
              <div key={str} onClick={()=>setFilterStrength(filterStrength===str?"all":str)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",background:filterStrength===str?`${cfg.color}22`:"rgba(255,255,255,0.03)",border:`1px solid ${filterStrength===str?cfg.color+"60":"rgba(255,255,255,0.08)"}`,borderRadius:99,cursor:"pointer",transition:"all 0.2s"}}>
                <span style={{fontSize:14}}>{cfg.emoji}</span>
                <span style={{color:cfg.color,fontWeight:700,fontSize:15}}>{stats[str]||0}</span>
                <span style={{color:"#6b7280",fontSize:12}}>{cfg.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {allWords.length>0&&(
          <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap",alignItems:"center"}}>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Kelime ara..." style={{flex:"1 1 160px",padding:"9px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#e2e8f0",fontSize:14,outline:"none",minWidth:120}}/>
            <select value={filterLang} onChange={e=>setFilterLang(e.target.value)} style={{padding:"9px 14px",background:"#111",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#e2e8f0",fontSize:14,cursor:"pointer"}}>
              <option value="all">Tum Diller</option>
              {languages.map(l=><option key={l} value={l}>{LANG_FLAGS[l]||"🌐"} {l}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:"9px 14px",background:"#111",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#e2e8f0",fontSize:14,cursor:"pointer"}}>
              <option value="lastSeen">Son Gorulen</option>
              <option value="strength_asc">Zayifdan Gucluye</option>
              <option value="strength_desc">Gucludan Zayifa</option>
              <option value="alpha">Alfabetik</option>
            </select>
            <span style={{color:"#6b7280",fontSize:13,marginLeft:4}}>{filtered.length} kelime</span>
          </div>
        )}

        {/* Empty State */}
        {allWords.length===0&&(
          <div style={{textAlign:"center",padding:"80px 20px"}}>
            <div style={{fontSize:64,marginBottom:16}}>📖</div>
            <h2 style={{color:"#374151",fontSize:22,fontWeight:700,margin:"0 0 12px"}}>Henuz ogrenilen kelime yok</h2>
            <p style={{color:"#6b7280",fontSize:15,maxWidth:360,margin:"0 auto 28px"}}>Oyunlarda kelime ogrendikce burada biriktirilecek ve tekrar edebileceksin.</p>
            {isGuest&&<p style={{color:"#f59e0b",fontSize:13,background:"rgba(245,158,11,0.08)",padding:"10px 20px",borderRadius:10,display:"inline-block"}}>💡 Uye olursan kelimeler tum cihazlarinda senkronize tutulur.</p>}
            <div style={{marginTop:24}}>
              <Link href="/" style={{padding:"12px 28px",background:"linear-gradient(135deg,#22d3ee,#6366f1)",borderRadius:12,color:"#fff",fontWeight:700,textDecoration:"none",fontSize:15}}>Oyunlara Git →</Link>
            </div>
          </div>
        )}

        {/* Word Grid */}
        {filtered.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
            {filtered.map(word=>{
              const cfg=STRENGTH_CONFIG[word.strength||1];
              return(
                <div key={word.id} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${cfg.color}30`,borderRadius:14,padding:"16px 18px",display:"flex",flexDirection:"column",gap:8,transition:"transform 0.15s,box-shadow 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${cfg.glow}`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}
                >
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:"#6b7280"}}>{LANG_FLAGS[word.language]||"🌐"}</span>
                    <span style={{fontSize:11,color:cfg.color,fontWeight:700}}>{cfg.emoji} {cfg.label}</span>
                  </div>
                  <div style={{fontSize:17,fontWeight:700,color:"#f1f5f9",lineHeight:1.3}}>{word.english}</div>
                  <div style={{fontSize:14,color:"#94a3b8"}}>{word.turkish}</div>
                  <div style={{display:"flex",gap:4,marginTop:4}}>
                    {[1,2,3,4,5].map(s=>(
                      <button key={s} title={STRENGTH_CONFIG[s].label} onClick={()=>handleStrengthUpdate(word.id,s)} style={{flex:1,height:5,borderRadius:99,border:"none",cursor:"pointer",background:s<=(word.strength||1)?cfg.color:"rgba(255,255,255,0.08)",transition:"background 0.2s"}}/>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length===0&&allWords.length>0&&(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#6b7280"}}>Filtreyle eslesen kelime bulunamadi.</div>
        )}
      </main>
    </div>
  );
}
