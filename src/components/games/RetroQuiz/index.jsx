"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';
import { GameHeader } from '../shared/GameHeader';
import { SoundManager } from '../../../engines/soundManager';
import { createSessionProgressTracker } from '../../../lib/progress/applySessionProgress';
import { Volume2, Award, Shield } from 'lucide-react';

export default function RetroQuiz({
  levelId,
  langId,
  onExit,
  onNextLevel,
  isAudioEnabled,
  setIsAudioEnabled,
  isFxEnabled,
  setIsFxEnabled
}) {
  const { words, isLoading, reload } = useLessonLoader(levelId, langId);
  const recordWordQuizResult = useMemolandumStore(state => state.recordWordQuizResult);
  const [activeScreen, setActiveScreen] = useState('playing'); // playing, paused, gameover, victory
  
  // Game metrics (state for UI/Header)
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [hintUsedForQuestion, setHintUsedForQuestion] = useState(false);
  const [learnedWords, setLearnedWords] = useState([]);
  /** Doğru cevap sonrası kelime çifti — okuma süresi için HUD'da tutulur */
  const [answerReveal, setAnswerReveal] = useState(null);

  // Canvas Refs & Game States
  const canvasRef = useRef(null);
  const soundManagerRef = useRef(null);
  const progressTrackerRef = useRef(createSessionProgressTracker('quiz'));
  const nextQuestionTimeoutRef = useRef(null);

  // Sync state to refs for the animation loop
  const stateRef = useRef({
    activeScreen: 'playing',
    score: 0,
    shields: 3,
    questionIndex: 0,
    totalQuestions: 10,
    combo: 0,
    currentQuestion: null,
    timeRemaining: 20.0,
    hintUsed: false,
    learnedWords: [],
    wordsList: [],
    transitioning: false,
    isFxEnabled: true,
    isAudioEnabled: true
  });

  // Keep stateRef in sync with React state
  useEffect(() => {
    stateRef.current.activeScreen = activeScreen;
    stateRef.current.score = score;
    stateRef.current.shields = shields;
    stateRef.current.questionIndex = questionIndex;
    stateRef.current.totalQuestions = totalQuestions;
    stateRef.current.combo = combo;
    stateRef.current.hintUsed = hintUsedForQuestion;
    stateRef.current.learnedWords = learnedWords;
    stateRef.current.isFxEnabled = isFxEnabled;
    stateRef.current.isAudioEnabled = isAudioEnabled;
  }, [activeScreen, score, shields, questionIndex, totalQuestions, combo, hintUsedForQuestion, learnedWords, isFxEnabled, isAudioEnabled]);

  // Game loop entity states
  const entitiesRef = useRef({
    ship: { x: 300, targetX: 300, y: 0, width: 40, height: 35 },
    lasers: [],
    targets: [],
    particles: [],
    floatingTexts: [],
    stars: [],
    dangerZoneY: 0,
    spawnY: 100,
    lastShootTime: 0,
    flashRedTimer: 0,
    flashGreenTimer: 0,
    successTextTimer: 0,
    isPointerDown: false
  });

  const keysPressedRef = useRef({ left: false, right: false, shoot: false });

  // Sound manager lifecycle
  useEffect(() => {
    soundManagerRef.current = new SoundManager();
    return () => {
      if (soundManagerRef.current) {
        soundManagerRef.current.stop();
      }
    };
  }, []);

  // Sync settings with SoundManager
  useEffect(() => {
    if (soundManagerRef.current) {
      soundManagerRef.current.setMuted(!isFxEnabled);
      soundManagerRef.current.setAudioEnabled(isAudioEnabled);
    }
  }, [isFxEnabled, isAudioEnabled]);

  // Session stats sync
  useEffect(() => {
    if (activeScreen === 'playing' && score === 0) {
      progressTrackerRef.current.reset();
    }
  }, [activeScreen, score]);

  useEffect(() => {
    if (activeScreen === 'gameover' || activeScreen === 'victory') {
      progressTrackerRef.current.commit({ score, gems: Math.floor(score / 300) });
    }
  }, [activeScreen, score]);

  // Warm up audio
  const handleWarmUp = () => {
    if (soundManagerRef.current) {
      soundManagerRef.current.init();
    }
  };

  // Play audio pronunciation of the word
  const playPronunciation = useCallback((wordObj) => {
    if (!isAudioEnabled || !wordObj) return;
    if (soundManagerRef.current && wordObj.audioUrl) {
      soundManagerRef.current.playWordAudio(wordObj.audioUrl);
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const speakText = wordObj.english;
      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, [isAudioEnabled]);

  // Generate a new question
  const generateQuestion = useCallback((index, wordList) => {
    if (!wordList || wordList.length === 0) return;
    
    const targetWordObj = wordList[index % wordList.length];
    const targetType = Math.random() > 0.5 ? 'en-to-tr' : 'tr-to-en';
    
    const questionText = targetType === 'en-to-tr' ? targetWordObj.english : targetWordObj.turkish;
    const correctAnswer = targetType === 'en-to-tr' ? targetWordObj.turkish : targetWordObj.english;
    const romanization = targetType === 'en-to-tr' ? targetWordObj.romanized : '';
    
    // Distractors
    const otherWords = wordList.filter(w => w.english !== targetWordObj.english);
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3).map(w => 
      targetType === 'en-to-tr' ? w.turkish : w.english
    );
    
    // Shuffle choices
    const choicesList = [correctAnswer, ...distractors]
      .map(value => ({ value, isCorrect: value === correctAnswer }))
      .sort(() => 0.5 - Math.random());
      
    const correctIdx = choicesList.findIndex(c => c.isCorrect);

    const question = {
      wordObj: targetWordObj,
      questionText,
      choices: choicesList,
      correctAnswerIndex: correctIdx,
      targetType,
      romanization,
      attempts: 1
    };

    stateRef.current.currentQuestion = question;
    stateRef.current.timeRemaining = 20.0;
    stateRef.current.hintUsed = false;
    stateRef.current.transitioning = false;

    // Reset input firing states on new question to prevent auto-firing loops
    entitiesRef.current.isPointerDown = false;
    if (keysPressedRef.current) {
      keysPressedRef.current.shoot = false;
    }

    setTimeLeft(20);
    setHintUsedForQuestion(false);
    setAnswerReveal(null);

    // Canvas targets setup
    const canvas = canvasRef.current;
    const width = canvas && canvas.width ? canvas.width : 600;
    const laneWidth = width / 4;
    entitiesRef.current.targets = choicesList.map((choice, i) => ({
      value: choice.value,
      isCorrect: choice.isCorrect,
      index: i,
      x: (i + 0.5) * laneWidth,
      y: entitiesRef.current.spawnY,
      width: laneWidth * 0.88,
      height: 42,
      active: true,
      isHit: false,
      isWarping: false,
      warpScaleY: 1.0,
      warpAlpha: 1.0,
      hitsCount: 0, // Wrong choices require 3 hits to explode
      maxHits: choice.isCorrect ? 1 : 3,
      hitAnimationTimer: 0
    }));
  }, []);

  // Update wordsList when loaded from useLessonLoader
  useEffect(() => {
    if (words && words.length > 0) {
      stateRef.current.wordsList = words;
      const qCount = Math.min(12, words.length);
      setTotalQuestions(qCount);
      stateRef.current.totalQuestions = qCount;
      generateQuestion(0, words);
    }
  }, [words, generateQuestion]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
    };
  }, []);

  // Spawn retro neon particles
  const spawnParticles = (x, y, count, isSuccess = true) => {
    const particles = entitiesRef.current.particles;
    const colors = isSuccess 
      ? ['#10b981', '#34d399', '#6ee7b7', '#fef08a'] 
      : ['#ef4444', '#f87171', '#fca5a5', '#fdba74'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.05
      });
    }
  };

  // Spawn dramatic green neon Star Wars hyperdrive particle burst on correct answer hit
  const spawnStarWarsParticles = (x, y) => {
    const particles = entitiesRef.current.particles;
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#a7f3d0', '#fef08a', '#ffffff'];

    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4.5 + Math.random() * 10; // High speed hyperdrive beams
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.035
      });
    }
  };

  // Starfield setup (Populate stars in canvas)
  const initStars = (width, height) => {
    const stars = [];
    for (let i = 0; i < 45; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.5 + Math.random() * 1.8,
        speed: 0.3 + Math.random() * 1.5
      });
    }
    entitiesRef.current.stars = stars;
  };

  // Trigger correct answer transition
  const handleCorrectAnswer = (hitX, hitY, hitTarget) => {
    if (stateRef.current.transitioning) return;
    stateRef.current.transitioning = true;
    entitiesRef.current.isPointerDown = false;
    if (keysPressedRef.current) keysPressedRef.current.shoot = false;

    // Trigger Star Wars hyperdrive warp exit on hit target
    if (hitTarget) {
      hitTarget.isWarping = true;
      hitTarget.warpScaleY = 1.0;
      hitTarget.warpAlpha = 1.0;
    }
    
    // Add points
    const basePoints = 100;
    const timeRemaining = stateRef.current.timeRemaining;
    const responseTimeSec = Math.max(0, 20 - timeRemaining);
    const timeBonus = Math.floor(timeRemaining * 10);
    const comboBonus = stateRef.current.combo * 15;
    const totalGained = basePoints + timeBonus + comboBonus;

    setScore(s => s + totalGained);
    setCombo(c => c + 1);

    if (soundManagerRef.current) {
      soundManagerRef.current.playCoinCollect();
    }

    // Add to vocabulary list & store AI metric update
    const currentQ = stateRef.current.currentQuestion;
    if (currentQ && currentQ.wordObj) {
      const qText = currentQ.questionText.toUpperCase();
      const aText = (currentQ.choices[currentQ.correctAnswerIndex]?.value || "").toUpperCase();
      const fullPair = `${qText} = ${aText}`;

      // Yavaş yükselen / yavaş sönen metin — kullanıcı okuyabilsin
      entitiesRef.current.floatingTexts.push({
        x: hitX,
        y: hitY - 10,
        text: `✓ ${fullPair}`,
        subText: `+${totalGained}`,
        vy: -0.42,
        alpha: 1.0,
        hold: 75, // ~1.25 sn tam opak
        decay: 0.006,
        color: '#34d399'
      });

      setAnswerReveal({
        english: currentQ.wordObj.english,
        turkish: currentQ.wordObj.turkish,
        romanization: currentQ.wordObj.romanized || currentQ.romanization || '',
        points: totalGained
      });

      const isCorrectFirstTry = currentQ.attempts === 1;
      setLearnedWords(prev => {
        if (prev.some(w => w.english === currentQ.wordObj.english)) return prev;
        return [...prev, {
          english: currentQ.wordObj.english,
          turkish: currentQ.wordObj.turkish,
          isCorrect: isCorrectFirstTry
        }];
      });
      if (recordWordQuizResult) {
        recordWordQuizResult(currentQ.wordObj, true, responseTimeSec, { 
          language: langId, 
          attempts: currentQ.attempts || 1,
          gameId: 'quiz'
        });
      }
      playPronunciation(currentQ.wordObj);
    }

    // Kelimeyi okumak için yeterli süre (warp + okuma)
    nextQuestionTimeoutRef.current = setTimeout(() => {
      setAnswerReveal(null);
      setQuestionIndex(prevIdx => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= stateRef.current.totalQuestions) {
          if (soundManagerRef.current) soundManagerRef.current.playStageClear();
          setActiveScreen('victory');
        } else {
          generateQuestion(nextIdx, stateRef.current.wordsList);
        }
        return nextIdx;
      });
    }, 2600);
  };

  // Trigger incorrect answer impact
  const handleIncorrectAnswer = () => {
    entitiesRef.current.flashRedTimer = 18;
    entitiesRef.current.isPointerDown = false;
    if (keysPressedRef.current) keysPressedRef.current.shoot = false;
    setCombo(0);

    const currentQ = stateRef.current.currentQuestion;
    if (currentQ) {
      currentQ.attempts = (currentQ.attempts || 1) + 1;
    }
    if (currentQ && currentQ.wordObj && recordWordQuizResult) {
      recordWordQuizResult(currentQ.wordObj, false, 10, { 
        language: langId, 
        attempts: currentQ?.attempts || 2,
        gameId: 'quiz'
      });
    }

    if (currentQ && currentQ.wordObj) {
      setLearnedWords(prev => {
        if (prev.some(w => w.english === currentQ.wordObj.english)) {
          return prev.map(w => w.english === currentQ.wordObj.english ? { ...w, isCorrect: false } : w);
        }
        return [...prev, {
          english: currentQ.wordObj.english,
          turkish: currentQ.wordObj.turkish,
          isCorrect: false
        }];
      });
    }

    if (soundManagerRef.current) {
      soundManagerRef.current.playDamage();
    }

    setShields(prev => {
      const nextShields = prev - 1;
      if (nextShields <= 0) {
        if (soundManagerRef.current) soundManagerRef.current.playGameOver();
        nextQuestionTimeoutRef.current = setTimeout(() => {
          setActiveScreen('gameover');
        }, 800);
      }
      return nextShields;
    });
  };

  // Trigger timeout/danger zone breach
  const handleTimeout = () => {
    if (stateRef.current.transitioning) return;
    stateRef.current.transitioning = true;
    entitiesRef.current.isPointerDown = false;
    if (keysPressedRef.current) keysPressedRef.current.shoot = false;

    entitiesRef.current.flashRedTimer = 25;
    setCombo(0);

    const currentQ = stateRef.current.currentQuestion;
    if (currentQ) {
      currentQ.attempts = (currentQ.attempts || 1) + 1;
    }
    if (currentQ && currentQ.wordObj && recordWordQuizResult) {
      recordWordQuizResult(currentQ.wordObj, false, 10, { 
        language: langId, 
        attempts: currentQ?.attempts || 2,
        gameId: 'quiz'
      });
    }

    if (currentQ && currentQ.wordObj) {
      setLearnedWords(prev => {
        if (prev.some(w => w.english === currentQ.wordObj.english)) return prev;
        return [...prev, {
          english: currentQ.wordObj.english,
          turkish: currentQ.wordObj.turkish,
          isCorrect: false
        }];
      });
    }

    if (soundManagerRef.current) {
      soundManagerRef.current.playDamage();
    }

    // Explode all options
    entitiesRef.current.targets.forEach(t => {
      if (t.active) {
        spawnParticles(t.x, t.y, 8, false);
        t.active = false;
      }
    });

    setShields(prev => {
      const nextShields = prev - 1;
      if (nextShields <= 0) {
        if (soundManagerRef.current) soundManagerRef.current.playGameOver();
        nextQuestionTimeoutRef.current = setTimeout(() => {
          setActiveScreen('gameover');
        }, 1000);
      } else {
        nextQuestionTimeoutRef.current = setTimeout(() => {
          setQuestionIndex(prevIdx => {
            const nextIdx = prevIdx + 1;
            if (nextIdx >= stateRef.current.totalQuestions) {
              if (soundManagerRef.current) soundManagerRef.current.playStageClear();
              setActiveScreen('victory');
            } else {
              generateQuestion(nextIdx, stateRef.current.wordsList);
            }
            return nextIdx;
          });
        }, 1200);
      }
      return nextShields;
    });
  };

  // Hint Button (💡 Eliminated 2 Wrong Answers)
  const handleUseHint = () => {
    if (hintUsedForQuestion || stateRef.current.transitioning || activeScreen !== 'playing') return;
    handleWarmUp();
    
    // Find incorrect, active options
    const activeWrongs = entitiesRef.current.targets.filter(t => t.active && !t.isCorrect);
    if (activeWrongs.length === 0) return;

    // Pick 2 at random
    const shuffled = [...activeWrongs].sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);

    toEliminate.forEach(t => {
      t.active = false;
      spawnParticles(t.x, t.y, 12, false);
    });

    if (soundManagerRef.current) {
      soundManagerRef.current.playExplosion();
    }

    setHintUsedForQuestion(true);
  };

  // Canvas Resize Handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Reset coordinates
      entitiesRef.current.ship.y = canvas.height - 50;
      entitiesRef.current.dangerZoneY = canvas.height - 110;
      
      // Update targets positions horizontally
      const laneWidth = canvas.width / 4;
      entitiesRef.current.targets.forEach((t, i) => {
        t.x = (i + 0.5) * laneWidth;
        t.width = laneWidth * 0.88;
      });

      if (entitiesRef.current.stars.length === 0) {
        initStars(canvas.width, canvas.height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [isLoading]);

  // Shoot trigger
  const spawnLaser = useCallback(() => {
    const ship = entitiesRef.current.ship;
    entitiesRef.current.lasers.push({
      x: ship.x,
      y: ship.y - 12,
      width: 4,
      height: 18,
      vy: -11
    });

    if (soundManagerRef.current) {
      soundManagerRef.current.playLaser();
    }
  }, []);

  // Main animation / physics loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let lastTime = performance.now();
    const fpsInterval = 1000 / 60; // 16.67ms per frame

    const update = (timestamp) => {
      animId = requestAnimationFrame(update);

      const elapsed = timestamp - lastTime;

      // If enough time has passed, draw the next frame
      if (elapsed >= fpsInterval) {
        // Get ready for next frame by subtracting excess time
        lastTime = timestamp - (elapsed % fpsInterval);

        const state = stateRef.current;
        const entities = entitiesRef.current;

        if (state.activeScreen !== 'playing') {
          return;
        }

        // 1. Tick Timer (Only if not transitioning)
        if (!state.transitioning && state.currentQuestion) {
          state.timeRemaining -= 1 / 60; // Approx 60fps
          
          // Push floating timer value to React state once per second
          const sec = Math.max(0, Math.ceil(state.timeRemaining));
          setTimeLeft(prev => prev !== sec ? sec : prev);

          if (state.timeRemaining <= 0) {
            state.timeRemaining = 0;
            handleTimeout();
          }
        }

        // 2. Smoothly steer ship to target coordinates based on key states
        const ship = entities.ship;
        const keys = keysPressedRef.current;
        const speed = 7.5; // Steer speed per frame
        if (keys.left) {
          ship.targetX = Math.max(25, ship.targetX - speed);
        }
        if (keys.right) {
          ship.targetX = Math.min(canvas.width - 25, ship.targetX + speed);
        }

        ship.x += (ship.targetX - ship.x) * 0.28;
        ship.x = Math.max(25, Math.min(canvas.width - 25, ship.x));

        // 3. Firing trigger (Only when pressing Space/Up key or FIRE button)
        const now = Date.now();
        const wantsToShoot = keys.shoot;
        if (!state.transitioning && wantsToShoot && now - entities.lastShootTime > 300) {
          spawnLaser();
          entities.lastShootTime = now;
        }

        // 4. Update Stars background (scrolling down)
        entities.stars.forEach(s => {
          s.y += s.speed;
          if (s.y > canvas.height) {
            s.y = -10;
            s.x = Math.random() * canvas.width;
          }
        });

        // 5. Update Lasers & Collisions (Safe backward loop)
        for (let i = entities.lasers.length - 1; i >= 0; i--) {
          const l = entities.lasers[i];
          l.y += l.vy;
          let hit = false;
          for (let j = 0; j < entities.targets.length; j++) {
            const t = entities.targets[j];
            if (t.active && !state.transitioning) {
              const left = t.x - t.width / 2;
              const right = t.x + t.width / 2;
              const top = t.y - t.height / 2;
              const bottom = t.y + t.height / 2;

              if (l.x >= left && l.x <= right && l.y >= top && l.y <= bottom) {
                hit = true;
                t.hitsCount = (t.hitsCount || 0) + 1;
                t.isHit = true;
                t.hitAnimationTimer = 18; // Frames of flash
                
                if (t.isCorrect) {
                  // Correct Choice hit! Trigger Star Wars hyperdrive warp exit on target!
                  spawnStarWarsParticles(t.x, t.y);
                  handleCorrectAnswer(t.x, t.y, t);
                } else {
                  // Wrong Choice hit! Requires 3 hits to explode
                  if (t.hitsCount >= t.maxHits) {
                    spawnParticles(t.x, t.y, 25, false);
                    t.active = false;
                    handleIncorrectAnswer();
                  } else {
                    // Small impact spark on 1st & 2nd hit
                    spawnParticles(t.x, t.y, 10, false);
                    if (soundManagerRef.current) {
                      soundManagerRef.current.playDamage();
                    }
                  }
                }
                break; // Stop checking other targets for this laser
              }
            }
          }

          if (hit || l.y < -20) {
            entities.lasers.splice(i, 1);
          }
        }

        // 6. Update Targets y-coordinates in sync with 20s Timer (30% slower pace)
        if (!state.transitioning && state.currentQuestion) {
          const spawnY = entities.spawnY;
          const limitY = entities.dangerZoneY;
          const progress = 1.0 - (state.timeRemaining / 20.0); // 0 to 1 over 20 seconds
          const currentY = spawnY + progress * (limitY - spawnY);

          entities.targets.forEach(t => {
            if (t.active && !t.isHit) {
              t.y = currentY;
            }
          });
        }

        // Update warping targets — biraz daha yavaş çıkış (kelime okunabilsin)
        entities.targets.forEach(t => {
          if (t.active && t.isWarping) {
            t.warpScaleY = (t.warpScaleY || 1.0) + 0.18;
            t.y -= 7;
            t.warpAlpha = Math.max(0, (t.warpAlpha || 1.0) - 0.022);
            if (t.warpAlpha <= 0) {
              t.active = false;
            }
          }
        });

        // 7. Update Particles (Safe backward loop)
        for (let i = entities.particles.length - 1; i >= 0; i--) {
          const p = entities.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            entities.particles.splice(i, 1);
          }
        }

        // 8. Floating kelime metni — hold sonra yavaş fade
        for (let i = entities.floatingTexts.length - 1; i >= 0; i--) {
          const ft = entities.floatingTexts[i];
          ft.y += ft.vy;
          if (ft.hold > 0) {
            ft.hold -= 1;
          } else {
            ft.alpha -= ft.decay != null ? ft.decay : 0.006;
          }
          if (ft.alpha <= 0) {
            entities.floatingTexts.splice(i, 1);
          }
        }

        // --- RENDER PHASE ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Starfield
        ctx.fillStyle = '#ffffff';
        entities.stars.forEach(s => {
          ctx.globalAlpha = 0.2 + (s.size / 2) * 0.5;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // 2. Draw Danger Line (Flashing red warning zone)
        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.25 + Math.sin(Date.now() / 150) * 0.15})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(0, entities.dangerZoneY);
        ctx.lineTo(canvas.width, entities.dangerZoneY);
        ctx.stroke();
        ctx.restore();

        // Danger Text warning
        if (!state.transitioning && state.timeRemaining < 3.5) {
          ctx.save();
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ CRITICAL DANGER ZONE // YAKLAŞIYOR ⚡', canvas.width / 2, entities.dangerZoneY - 12);
          ctx.restore();
        }

        // 3. Draw Lasers
        entities.lasers.forEach(l => {
          ctx.save();
          ctx.fillStyle = '#22d3ee';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 8;
          ctx.fillRect(l.x - l.width / 2, l.y, l.width, l.height);
          ctx.restore();
        });

        // 4. Draw Targets (Option Boxes) with Progressive Red Color on Hits & Star Wars Warp Exit
        entities.targets.forEach(t => {
          if (!t.active) return;

          ctx.save();
          let borderGlow = '#06b6d4'; // Cyan default
          let fillStyle = 'rgba(15, 23, 42, 0.85)';
          let textColor = '#e2e8f0';

          if (t.isWarping) {
            borderGlow = '#34d399'; // Emerald Star Wars hyperdrive light beam
            fillStyle = 'rgba(52, 211, 153, 0.5)';
            textColor = '#ffffff';
            ctx.globalAlpha = t.warpAlpha || 1.0;
          } else if (t.isCorrect && t.isHit) {
            borderGlow = '#10b981'; // Green for correct answer hit
            fillStyle = 'rgba(16, 185, 129, 0.4)';
            textColor = '#ffffff';
          } else if (!t.isCorrect) {
            // Progressive Red shift on each hit (Hit 1: Amber, Hit 2: Deep Red)
            if (t.hitsCount === 1) {
              borderGlow = '#f59e0b'; // Amber / Orange on 1st hit
              fillStyle = 'rgba(245, 158, 11, 0.35)';
              textColor = '#fef08a';
            } else if (t.hitsCount >= 2) {
              borderGlow = '#ef4444'; // Bright Red alert on 2nd hit
              fillStyle = 'rgba(239, 68, 68, 0.45)';
              textColor = '#fca5a5';
            }
          }

          // Draw outer glow shadow
          ctx.shadowColor = borderGlow;
          ctx.shadowBlur = t.isWarping ? 25 : 12;

          const renderHeight = t.isWarping ? t.height * (t.warpScaleY || 1.0) : t.height;

          // Rounded box shape
          drawRoundedRect(
            ctx, 
            t.x - t.width / 2, 
            t.y - renderHeight / 2, 
            t.width, 
            renderHeight, 
            10, 
            fillStyle, 
            borderGlow, 
            t.isWarping ? 3 : 2
          );

          // Clear shadow for text rendering
          ctx.shadowBlur = 0;

          // Text inside option box (Only when not fully warped out)
          if (!t.isWarping || (t.warpScaleY || 1.0) < 2.5) {
            ctx.fillStyle = textColor;
            drawTextFit(ctx, t.value.toUpperCase(), t.x, t.y, t.width - 15, 14);
          }
          ctx.restore();
        });

        // 5. Draw Particles
        entities.particles.forEach(p => {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        ctx.globalAlpha = 1.0;

        // 6. Draw Floating Score/Word Texts (Rising upward from hit target)
        entities.floatingTexts.forEach(ft => {
          ctx.save();
          ctx.globalAlpha = Math.max(0, ft.alpha);
          ctx.fillStyle = ft.color;
          ctx.textAlign = 'center';
          ctx.shadowColor = ft.color;
          ctx.shadowBlur = 14;
          ctx.font = 'bold 17px monospace';
          ctx.fillText(ft.text, ft.x, ft.y);
          if (ft.subText) {
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = '#fef08a';
            ctx.fillText(ft.subText, ft.x, ft.y + 18);
          }
          ctx.restore();
        });

        // 7. Draw Spaceship Fighter
        ctx.save();
        // Apply screen shaking on red flash
        if (entities.flashRedTimer > 0) {
          const shakeX = (Math.random() - 0.5) * 6;
          const shakeY = (Math.random() - 0.5) * 6;
          ctx.translate(shakeX, shakeY);
        }
        drawShip(ctx, ship.x, ship.y, state.shields);
        ctx.restore();

        // 8. Timers decay per frame
        if (entities.flashRedTimer > 0) entities.flashRedTimer--;
      }
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isLoading, activeScreen, generateQuestion, spawnLaser]);

  // Touch/Mouse move handler (Ship steering)
  const handlePointerMove = (e) => {
    if (activeScreen !== 'playing') return;
    if (!entitiesRef.current.isPointerDown) return; // Ignore steering if not dragging/clicking
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const relativeX = clientX - rect.left;
    entitiesRef.current.ship.targetX = relativeX;
  };

  // Keyboard steer listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeScreen !== 'playing') return;
      const keys = keysPressedRef.current;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        keys.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        keys.right = true;
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        keys.shoot = true;
      }
    };

    const handleKeyUp = (e) => {
      const keys = keysPressedRef.current;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        keys.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        keys.right = false;
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        keys.shoot = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeScreen]);

  // Global Pointer & Touch Release Safety Net (Prevents stuck shooting loops)
  useEffect(() => {
    const handleGlobalRelease = () => {
      entitiesRef.current.isPointerDown = false;
      if (keysPressedRef.current) {
        keysPressedRef.current.shoot = false;
        keysPressedRef.current.left = false;
        keysPressedRef.current.right = false;
      }
    };

    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);
    window.addEventListener('blur', handleGlobalRelease);

    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
    };
  }, []);

  // Rounded Rect helper
  const drawRoundedRect = (ctx, x, y, width, height, radius, fill, stroke, strokeWidth) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
    ctx.restore();
  };

  // Fit text inside option block with multi-line wrapping and readability protection
  const drawTextFit = (ctx, text, x, y, maxWidth, fontBaseSize) => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const minSize = 10; // Don't let font size drop below 10px for readability
    let size = fontBaseSize;
    
    // Helper to split text into lines at a specific font size
    const getLines = (txt, maxW, fontSize) => {
      ctx.font = `bold ${fontSize}px monospace`;
      const words = txt.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width <= maxW) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    // 1. Try to fit on 1 line by scaling down slightly (but no lower than 12px)
    let lines = [text];
    let fitsOnOneLine = false;
    for (let s = fontBaseSize; s >= 12; s--) {
      ctx.font = `bold ${s}px monospace`;
      if (ctx.measureText(text).width <= maxWidth) {
        size = s;
        lines = [text];
        fitsOnOneLine = true;
        break;
      }
    }

    // 2. If it doesn't fit on 1 line, find the largest font size (>= 10px) that fits in 2 lines
    if (!fitsOnOneLine) {
      let bestSize = minSize;
      let bestLines = getLines(text, maxWidth, minSize);
      
      for (let s = fontBaseSize; s >= minSize; s--) {
        const testLines = getLines(text, maxWidth, s);
        if (testLines.length <= 2 && testLines.every(l => ctx.measureText(l).width <= maxWidth)) {
          bestSize = s;
          bestLines = testLines;
          break; // Found the largest size that fits in 2 lines!
        }
      }
      
      size = bestSize;
      lines = bestLines;
    }
    
    // Draw lines centered vertically around y
    ctx.font = `bold ${size}px monospace`;
    const lineHeight = size + 2;
    const totalHeight = lines.length * lineHeight;
    const startY = y - (totalHeight / 2) + (lineHeight / 2);
    
    lines.forEach((line, index) => {
      ctx.fillText(line, x, startY + index * lineHeight);
    });
    
    ctx.restore();
  };

  // Spaceship drawing paths
  const drawShip = (ctx, x, y, shieldsCount) => {
    // Engine thruster glow
    const thrusterLength = 9 + Math.random() * 12;
    const grad = ctx.createLinearGradient(x, y + 14, x, y + 14 + thrusterLength);
    grad.addColorStop(0, '#f97316'); // Neon Orange
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 14);
    ctx.lineTo(x + 4, y + 14);
    ctx.lineTo(x, y + 14 + thrusterLength);
    ctx.closePath();
    ctx.fill();

    // Wings glow & drawing
    ctx.fillStyle = '#0891b2'; // Darker Cyan
    ctx.strokeStyle = '#06b6d4'; // Bright Cyan border
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(x, y - 20); // nose
    ctx.lineTo(x - 20, y + 14); // left wing tip
    ctx.lineTo(x - 7, y + 8);
    ctx.lineTo(x + 7, y + 8);
    ctx.lineTo(x + 20, y + 14); // right wing tip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x - 4, y + 1);
    ctx.lineTo(x + 4, y + 1);
    ctx.closePath();
    ctx.fill();

    // Shield Bubble (visual check)
    if (shieldsCount > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.22 + Math.sin(Date.now() / 150) * 0.08})`;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12 + Math.sin(Date.now() / 120) * 4;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(x, y - 2, 33, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handleResume = () => {
    setActiveScreen('playing');
  };

  const handleRestart = () => {
    setScore(0);
    setShields(3);
    setCombo(0);
    setQuestionIndex(0);
    setLearnedWords([]);
    
    stateRef.current.score = 0;
    stateRef.current.shields = 3;
    stateRef.current.combo = 0;
    stateRef.current.questionIndex = 0;
    stateRef.current.learnedWords = [];
    
    setActiveScreen('playing');
    // Yeni rastgele 12'lik oturum seti
    if (typeof reload === 'function') reload();
    else generateQuestion(0, words);
  };

  const handleExit = () => {
    if (onExit) onExit();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#070510] text-amber-400">
        <div className="text-xl font-mono tracking-widest animate-pulse">
          MEMOLANDUM YÜKLENİYOR...
        </div>
      </div>
    );
  }

  const currentQuestion = stateRef.current.currentQuestion;

  return (
    <div className="w-full h-full bg-[#070510] flex justify-center items-center relative overflow-hidden select-none">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,36,0)_50%,rgba(0,0,0,0.4)_50%),linear-gradient(90deg,rgba(245,158,11,0.02),rgba(0,0,0,0),rgba(245,158,11,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
      
      <div className="w-full max-w-[640px] h-full relative flex flex-col justify-between p-4 md:p-6 z-10">
        
        {/* HUD Header */}
        <GameHeader>
          <GameHeader.Left>
            <GameHeader.Shields max={3} current={shields} />
            <GameHeader.Stage value={questionIndex + 1} max={totalQuestions} label="SORU" />
          </GameHeader.Left>

          <GameHeader.Right>
            {activeScreen === 'playing' && (
              <button 
                onClick={handleUseHint}
                disabled={hintUsedForQuestion || stateRef.current.transitioning}
                className={`flex items-center gap-1 border rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition-all ${
                  hintUsedForQuestion 
                    ? 'bg-slate-800/40 border-slate-700/50 text-slate-600 cursor-not-allowed' 
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black shadow-[0_0_8px_rgba(245,158,11,0.15)] active:scale-95'
                }`}
                title="Yarısını Ele (50/50)"
              >
                💡 HINT
              </button>
            )}
            <GameHeader.Score value={score} />
            <GameHeader.Controls 
              isFxEnabled={isFxEnabled}
              onFxToggle={() => setIsFxEnabled && setIsFxEnabled(!isFxEnabled)}
              isAudioEnabled={isAudioEnabled}
              onAudioToggle={() => setIsAudioEnabled && setIsAudioEnabled(!isAudioEnabled)}
              onPause={() => setActiveScreen('paused')}
            />
          </GameHeader.Right>
        </GameHeader>

        {/* Floating Holographic Target display */}
        {activeScreen === 'playing' && currentQuestion && (
          <div className={`absolute top-18 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] flex flex-col items-center justify-center py-2.5 px-4 rounded-2xl text-center z-20 pointer-events-auto ${
            answerReveal
              ? 'bg-emerald-950/90 border border-emerald-400/40 shadow-[0_0_24px_rgba(16,185,129,0.25)]'
              : 'bg-slate-950/85 border border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.12),inset_0_0_10px_rgba(245,158,11,0.08)]'
          }`}>
            <div className={`text-[8px] font-mono tracking-widest uppercase ${answerReveal ? 'text-emerald-400/70' : 'text-amber-500/40'}`}>
              {answerReveal ? 'CORRECT // DOĞRU CEVAP' : 'TARGET WORD // HEDEF KELİME'}
            </div>
            
            {answerReveal ? (
              <>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] break-all px-2 mt-0.5 leading-tight">
                  {answerReveal.english}
                </h2>
                <p className="text-base sm:text-lg font-bold text-emerald-300 m-0 mt-1 tracking-wide">
                  = {answerReveal.turkish}
                </p>
                {answerReveal.romanization && (
                  <div className="text-[10px] font-mono text-cyan-300 mt-0.5 tracking-wider">
                    [{answerReveal.romanization}]
                  </div>
                )}
                <p className="text-[10px] font-mono text-amber-300/80 m-0 mt-1">+{answerReveal.points} XP</p>
              </>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.45)] break-all px-2 mt-0.5 leading-tight">
                  {currentQuestion.questionText}
                </h2>
                
                {currentQuestion.romanization && (
                  <div className="text-[10px] font-mono text-cyan-400 mt-0.5 tracking-wider animate-pulse">
                    [{currentQuestion.romanization}]
                  </div>
                )}

                {/* Time progress bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-amber-500/80 transition-all duration-100" style={{ width: `${(timeLeft / 20) * 100}%`, boxShadow: '0 0 8px #f59e0b' }} />
              </>
            )}
          </div>
        )}

        {/* Space Shooter Canvas Arena */}
        <div className="flex-1 w-full relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 my-3 pointer-events-auto">
          <canvas
            ref={canvasRef}
            className="w-full h-full block touch-none cursor-crosshair"
            onPointerDown={(e) => {
              handleWarmUp();
              entitiesRef.current.isPointerDown = true;
              handlePointerMove(e);
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={() => {
              entitiesRef.current.isPointerDown = false;
            }}
            onPointerLeave={() => {
              entitiesRef.current.isPointerDown = false;
            }}
            onPointerCancel={() => {
              entitiesRef.current.isPointerDown = false;
            }}
          />

          {/* Combo overlay */}
          {activeScreen === 'playing' && combo > 1 && (
            <div className="absolute bottom-4 left-4 text-xs font-mono text-cyan-400 tracking-wider flex items-center gap-1.5 animate-bounce bg-cyan-950/50 border border-cyan-500/30 px-3 py-1 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.15)] pointer-events-none">
              <Award className="w-3.5 h-3.5 fill-cyan-500" />
              COMBO: x{combo}!
            </div>
          )}
        </div>

        {/* Dedicated Mobile / Touch Controls (Separate Steering & Fire) */}
        {activeScreen === 'playing' && (
          <div className="w-full flex items-center justify-between gap-3 my-1.5 px-1 pointer-events-auto font-mono select-none">
            {/* Steering Left/Right Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleWarmUp();
                  const ship = entitiesRef.current.ship;
                  ship.targetX = Math.max(30, ship.targetX - 70);
                }}
                className="w-14 h-12 bg-slate-900/90 border-2 border-cyan-500/50 hover:border-cyan-400 text-cyan-300 active:bg-cyan-950 rounded-2xl flex items-center justify-center text-xl font-black shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 transition-all cursor-pointer"
                title="Sola Git"
              >
                ◀
              </button>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleWarmUp();
                  const ship = entitiesRef.current.ship;
                  const maxW = canvasRef.current?.width || 500;
                  ship.targetX = Math.min(maxW - 30, ship.targetX + 70);
                }}
                className="w-14 h-12 bg-slate-900/90 border-2 border-cyan-500/50 hover:border-cyan-400 text-cyan-300 active:bg-cyan-950 rounded-2xl flex items-center justify-center text-xl font-black shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 transition-all cursor-pointer"
                title="Sağa Git"
              >
                ▶
              </button>
            </div>

            {/* Separate FIRE Button */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handleWarmUp();
                spawnLaser();
              }}
              className="flex-1 max-w-[220px] h-12 bg-gradient-to-r from-pink-600 via-rose-500 to-red-600 border-2 border-pink-400 text-white font-black text-sm tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.5)] active:scale-95 transition-all uppercase cursor-pointer"
            >
              🔥 ATEŞ ET (FIRE)
            </button>
          </div>
        )}

        {/* Overlays */}
        {activeScreen === 'paused' && (
          <PauseScreen 
            onResume={handleResume} 
            onRestart={handleRestart} 
            onMainMenu={handleExit}
            words={words}
            levelId={levelId}
            langId={langId}
            currentGameType="quiz"
            onMiniQuizCorrect={() => {
              setShields(s => Math.min(3, s + 1));
              setScore(s => s + 50);
            }}
          />
        )}
        
        {activeScreen === 'gameover' && (
          <GameOverScreen 
            score={score} 
            onRestart={handleRestart} 
            onMainMenu={handleExit}
            words={words}
            levelId={levelId}
            langId={langId}
            currentGameType="quiz"
            message="SHIELDS DEPLETED // SYSTEM DISRUPTED"
          />
        )}
        
        {activeScreen === 'victory' && (
          <VictoryScreen 
            score={score} 
            onNextLevel={onNextLevel ? () => onNextLevel() : handleRestart} 
            onMainMenu={handleExit}
            words={words}
            levelId={levelId}
            langId={langId}
            currentGameType="quiz"
          >
            <div className="flex flex-col items-center w-full bg-slate-950/60 p-4 rounded-2xl border border-amber-500/30 max-h-48 overflow-y-auto custom-scrollbar">
              <h3 className="text-amber-400 mb-3 text-xs tracking-widest font-mono uppercase">LEARNED VOCABULARY</h3>
              <ul className="flex flex-wrap gap-2 justify-center">
                 {learnedWords.map((wordItem, idx) => (
                    <li 
                      key={idx} 
                      className={`${
                        wordItem.isCorrect 
                          ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/50' 
                          : 'text-red-400 bg-red-950/30 border-red-500/50'
                      } px-3 py-1 rounded-full border text-xs font-mono font-bold`}
                    >
                      {wordItem.english}: {wordItem.turkish}
                    </li>
                 ))}
              </ul>
            </div>
          </VictoryScreen>
        )}
        
      </div>
    </div>
  );
}
