"use client";
import React, { useEffect, useState } from "react";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import Header from "../../components/Header";
import { useRouter } from "next/navigation";
import { changeUsername } from "../../lib/firebase/authService";
import { auth } from "../../lib/firebase/config";

const PRESET_AVATARS = [
  "https://api.dicebear.com/9.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Oliver",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Nala",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Tinkerbell",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Jack",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Sasha"
];

const MOCK_PROGRESS = [
  { language: "İngilizce (Genel)", level: "A2", percentage: 75, color: "#38bdf8" },
  { language: "İngilizce (YDS)", level: "B1", percentage: 40, color: "#a855f7" },
  { language: "Almanca (Başlangıç)", level: "A1", percentage: 90, color: "#22c55e" },
];

export default function ProfilePage() {
  const { profile, changeAvatar, isAuthenticated, isAuthLoading } = useMemolandumStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const handleEditUsername = () => {
    setNewUsernameInput(profile?.displayName || "");
    setIsEditingUsername(true);
    setUsernameError("");
  };

  const handleSaveUsername = async () => {
    if (!newUsernameInput || newUsernameInput.trim().length < 3) {
      setUsernameError("En az 3 karakter olmalı.");
      return;
    }
    
    setIsSavingUsername(true);
    setUsernameError("");
    try {
      await changeUsername(auth.currentUser, profile.displayName, newUsernameInput.trim());
      setIsEditingUsername(false);
    } catch (err) {
      setUsernameError(err.message || "Bir hata oluştu.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [mounted, isAuthenticated, isAuthLoading, router]);

  if (!mounted || isAuthLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-[#0b101a] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0b101a] text-gray-200 font-sans relative overflow-hidden flex flex-col">
      <Header />
      
      {/* Background Glows */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="profile-container w-full max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 relative z-10">
        <div className="profile-hero">
          {profile?.photoURL ? (
            <img 
              src={profile.photoURL} 
              alt="Profil" 
              className="current-hero-avatar"
            />
          ) : (
            <div className="current-hero-avatar flex items-center justify-center text-4xl font-bold text-white">
              {(profile?.displayName || profile?.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-1">
            {isEditingUsername ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newUsernameInput}
                    onChange={(e) => setNewUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1 focus:outline-none focus:border-cyan-500 font-bold"
                    placeholder="Yeni İsim"
                  />
                  <button onClick={handleSaveUsername} disabled={isSavingUsername} className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg disabled:opacity-50 text-sm font-bold">
                    {isSavingUsername ? '...' : 'Kaydet'}
                  </button>
                  <button onClick={() => setIsEditingUsername(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                    İptal
                  </button>
                </div>
                {usernameError && <span className="text-red-400 text-sm">{usernameError}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white">{profile?.displayName || "Siber Savaşçı"}</h1>
                <button onClick={handleEditUsername} className="text-gray-400 hover:text-cyan-400 transition-colors" title="Kullanıcı adını değiştir">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="user-email text-gray-400">{profile?.email}</p>
          </div>
        </div>

        <section className="profile-section">
          <h2>Karakterini Seç (Avatar)</h2>
          <div className="avatar-grid">
            {PRESET_AVATARS.map((url, index) => (
              <button 
                key={index} 
                onClick={() => changeAvatar(url)}
                className={`avatar-option-btn ${profile?.photoURL === url ? "selected" : ""}`}
              >
                <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-auto" />
              </button>
            ))}
          </div>
        </section>

        <section className="profile-section">
          <h2>Dil Potansiyeli İlerleme Durumu</h2>
          <div className="chart-container">
            {MOCK_PROGRESS.map((item, idx) => (
              <div key={idx} className="progress-bar-row">
                <div className="bar-info">
                  <span className="lang-name">{item.language}</span>
                  <span className="lang-level">{item.level}</span>
                </div>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: `${item.percentage}%`, backgroundColor: item.color }}>
                    <span className="bar-percentage">%{item.percentage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .profile-hero { 
          display: flex; 
          align-items: center; 
          gap: 24px; 
          background: rgba(30, 27, 75, 0.4); 
          border: 1px solid rgba(79, 70, 229, 0.3); 
          padding: 24px; 
          border-radius: 16px; 
          backdrop-filter: blur(10px);
        }
        .current-hero-avatar { 
          width: 96px; 
          height: 96px; 
          border-radius: 50%; 
          background: #312e81; 
          border: 2px solid #38bdf8; 
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
          object-fit: cover;
        }
        .profile-section { 
          background: rgba(15, 23, 42, 0.6); 
          border: 1px solid rgba(255,255,255,0.05); 
          padding: 32px; 
          border-radius: 16px;
          backdrop-filter: blur(10px); 
        }
        .profile-section h2 { 
          font-size: 20px; 
          font-weight: 800; 
          margin-bottom: 24px; 
          color: #e2e8f0; 
          letter-spacing: 0.5px;
        }
        .avatar-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); 
          gap: 16px; 
        }
        .avatar-option-btn { 
          background: rgba(30, 41, 59, 0.8); 
          border: 2px solid transparent; 
          border-radius: 12px; 
          padding: 8px; 
          cursor: pointer; 
          transition: all 0.2s ease; 
        }
        .avatar-option-btn:hover { 
          transform: translateY(-2px) scale(1.05); 
          background: rgba(51, 65, 85, 0.8); 
        }
        .avatar-option-btn.selected { 
          border-color: #a855f7; 
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.5); 
          background: rgba(46, 16, 101, 0.8); 
        }
        .chart-container { 
          display: flex; 
          flex-direction: column; 
          gap: 24px; 
        }
        .progress-bar-row { 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
        }
        .bar-info { 
          display: flex; 
          justify-content: space-between; 
          font-size: 15px; 
          font-weight: 600; 
        }
        .lang-name {
          color: #cbd5e1;
        }
        .lang-level { 
          background: rgba(255,255,255,0.1); 
          padding: 2px 10px; 
          border-radius: 12px; 
          font-size: 13px; 
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .bar-bg { 
          width: 100%; 
          height: 24px; 
          background: rgba(30, 41, 59, 0.8); 
          border-radius: 12px; 
          overflow: hidden; 
          border: 1px solid rgba(255,255,255,0.05);
        }
        .bar-fill { 
          height: 100%; 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: flex-end; 
          padding-right: 12px; 
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .bar-percentage { 
          font-size: 12px; 
          font-weight: 800; 
          color: rgba(0,0,0,0.7); 
        }
      `}</style>
    </div>
  );
}
