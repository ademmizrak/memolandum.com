"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
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
  const { words, isLoading } = useLessonLoader(levelId, langId);
  const [activeScreen, setActiveScreen] = useState('playing'); // playing, paused, gameover, victory
  
  // Game metrics (state for UI/Header)
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [hintUsedForQuestion, setHintUsedForQuestion] = useState(false);
  const [learnedWords, setLearnedWords] = useState([]);

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
    timeRemaining: 10.0,
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
    stars: [],
    dangerZoneY: 0,
    spawnY: 100,
    lastShootTime: 0,
    flashRedTimer: 0,
    flashGreenTimer: 0,
    successTextTimer: 0
  });

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
      romanization
    };

    stateRef.current.currentQuestion = question;
    stateRef.current.timeRemaining = 10.0;
    stateRef.current.hintUsed = false;
    stateRef.current.transitioning = false;

    setTimeLeft(10);
    setHintUsedForQuestion(false);

    // Canvas targets setup
    const canvas = canvasRef.current;
    if (canvas) {
      const laneWidth = canvas.width / 4;
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
        hitAnimationTimer: 0
      }));
    }
  }, []);

  // Initialize Lesson Words
  useEffect(() => {
    if (!isLoading && words && words.length > 0) {
      const qCount = Math.min(10, words.length);
      setTotalQuestions(qCount);
      stateRef.current.totalQuestions = qCount;
      stateRef.current.wordsList = words;
      setQuestionIndex(0);
      setScore(0);
      setShields(3);
      setLearnedWords([]);
      
      generateQuestion(0, words);
    }
  }, [isLoading, words, generateQuestion]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
    };
  }, []);

  // Spawn retro neon particles
  const spawnParticles = (x, y, count = 15, isGreen = true) => {
    const particles = entitiesRef.current.particles;
    const colors = isGreen 
      ? ['#10b981', '#34d399', '#059669', '#6ee7b7', '#a7f3d0'] // Emerald theme
      : ['#f43f5e', '#fb7185', '#e11d48', '#fda4af', '#fecdd3']; // Rose theme
      
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 3.5,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  };

  // Spark/laser flash effect
  const spawnLaserSpark = (x, y) => {
    const particles = entitiesRef.current.particles;
    for (let i = 0; i < 4; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color: '#22d3ee',
        size: 1.5,
        alpha: 0.8,
        decay: 0.05
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
  const handleCorrectAnswer = (hitX, hitY) => {
    if (stateRef.current.transitioning) return;
    stateRef.current.transitioning = true;
    entitiesRef.current.flashGreenTimer = 15;
    entitiesRef.current.successTextTimer = 60;
    
    // Add points
    const basePoints = 100;
    const timeBonus = Math.floor(stateRef.current.timeRemaining * 10);
    const comboBonus = stateRef.current.combo * 15;
    const totalGained = basePoints + timeBonus + comboBonus;

    setScore(s => s + totalGained);
    setCombo(c => c + 1);

    if (soundManagerRef.current) {
      soundManagerRef.current.playCoinCollect();
    }

    // Add to vocabulary list
    const currentQ = stateRef.current.currentQuestion;
    if (currentQ) {
      const pair = `${currentQ.wordObj.english}: ${currentQ.wordObj.turkish}`;
      setLearnedWords(prev => {
        if (!prev.includes(pair)) return [...prev, pair];
        return prev;
      });
      playPronunciation(currentQ.wordObj);
    }

    // Advance next question
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
  };

  // Trigger incorrect answer impact
  const handleIncorrectAnswer = () => {
    entitiesRef.current.flashRedTimer = 18;
    setCombo(0);

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
    entitiesRef.current.flashRedTimer = 25;
    setCombo(0);

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
        }, 1500);
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
  }, []);

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

    const update = () => {
      const state = stateRef.current;
      const entities = entitiesRef.current;

      if (state.activeScreen !== 'playing') {
        animId = requestAnimationFrame(update);
        return;
      }

      // 1. Tick Timer (Only if not transitioning)
      if (!state.transitioning && state.currentQuestion) {
        state.timeRemaining -= 1 / 60; // Approx 60fps
        
        // Push floating timer value to React state once per second
        const sec = Math.max(0, Math.ceil(state.timeRemaining));
        setTimeLeft(sec);

        if (state.timeRemaining <= 0) {
          state.timeRemaining = 0;
          handleTimeout();
        }
      }

      // 2. Smoothly steer ship to target coordinates
      const ship = entities.ship;
      ship.x += (ship.targetX - ship.x) * 0.28;
      // Clamp inside canvas bounds
      ship.x = Math.max(25, Math.min(canvas.width - 25, ship.x));

      // 3. Auto firing trigger (Every 400ms)
      const now = Date.now();
      if (!state.transitioning && now - entities.lastShootTime > 400) {
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

      // 5. Update Lasers
      entities.lasers.forEach((l, idx) => {
        l.y += l.vy;
        // Collision with targets
        entities.targets.forEach(t => {
          if (t.active && !t.isHit && !state.transitioning) {
            const left = t.x - t.width / 2;
            const right = t.x + t.width / 2;
            const top = t.y - t.height / 2;
            const bottom = t.y + t.height / 2;

            if (l.x >= left && l.x <= right && l.y >= top && l.y <= bottom) {
              // Collide! Remove laser, mark target hit
              entities.lasers.splice(idx, 1);
              t.isHit = true;
              t.hitAnimationTimer = 18; // Frames of flash
              
              if (t.isCorrect) {
                // Correct Choice hit!
                spawnParticles(t.x, t.y, 25, true);
                handleCorrectAnswer(t.x, t.y);
              } else {
                // Wrong Choice hit!
                spawnParticles(t.x, t.y, 15, false);
                t.active = false;
                handleIncorrectAnswer();
              }
            }
          }
        });
      });
      // Remove out of bounds lasers
      entities.lasers = entities.lasers.filter(l => l.y > -20);

      // 6. Update Targets y-coordinates in sync with Timer
      if (!state.transitioning && state.currentQuestion) {
        const spawnY = entities.spawnY;
        const limitY = entities.dangerZoneY;
        const progress = 1.0 - (state.timeRemaining / 10.0); // 0 to 1
        const currentY = spawnY + progress * (limitY - spawnY);

        entities.targets.forEach(t => {
          if (t.active && !t.isHit) {
            t.y = currentY;
          }
        });
      }

      // 7. Update Particles
      entities.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          entities.particles.splice(idx, 1);
        }
      });

      // 8. Timers decay
      if (entities.flashRedTimer > 0) entities.flashRedTimer--;
      if (entities.flashGreenTimer > 0) entities.flashGreenTimer--;
      if (entities.successTextTimer > 0) entities.successTextTimer--;

      // --- RENDERING ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Starfield
      ctx.fillStyle = '#ffffff';
      entities.stars.forEach(s => {
        ctx.globalAlpha = s.speed / 1.5;
        ctx.fillRect(s.x, s.y, s.size, s.size);
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

      // 4. Draw Targets (Option Boxes)
      entities.targets.forEach(t => {
        if (!t.active) return;

        ctx.save();
        let borderGlow = '#06b6d4'; // Cyan default
        let fillStyle = 'rgba(15, 23, 42, 0.85)';
        let textColor = '#e2e8f0';

        if (t.isHit) {
          borderGlow = t.isCorrect ? '#10b981' : '#f43f5e';
          fillStyle = t.isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)';
          textColor = '#ffffff';
        }

        // Draw outer glow shadow
        ctx.shadowColor = borderGlow;
        ctx.shadowBlur = 12;

        // Rounded box shape
        drawRoundedRect(
          ctx, 
          t.x - t.width / 2, 
          t.y - t.height / 2, 
          t.width, 
          t.height, 
          10, 
          fillStyle, 
          borderGlow, 
          2
        );

        // Clear shadow for text rendering
        ctx.shadowBlur = 0;

        // Text inside option box
        ctx.fillStyle = textColor;
        drawTextFit(ctx, t.value.toUpperCase(), t.x, t.y, t.width - 15, 14);
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

      // 6. Draw Spaceship Fighter
      ctx.save();
      // Apply screen shaking on red flash
      if (entities.flashRedTimer > 0) {
        const shakeX = (Math.random() - 0.5) * 6;
        const shakeY = (Math.random() - 0.5) * 6;
        ctx.translate(shakeX, shakeY);
      }
      drawShip(ctx, ship.x, ship.y, state.shields);
      ctx.restore();

      // 7. Screen overlays (Damage flash, victory flash)
      if (entities.flashRedTimer > 0) {
        ctx.fillStyle = `rgba(244, 63, 94, ${entities.flashRedTimer / 45})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (entities.flashGreenTimer > 0) {
        ctx.fillStyle = `rgba(16, 185, 129, ${entities.flashGreenTimer / 45})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Success feedback texts
      if (entities.successTextTimer > 0) {
        ctx.save();
        ctx.fillStyle = '#34d399';
        ctx.font = 'black 22px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.fillText('TARGET ACQUIRED! (+100)', canvas.width / 2, canvas.height / 2 - 20);
        ctx.restore();
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeScreen, generateQuestion, spawnLaser]);

  // Touch/Mouse move handler (Ship steering)
  const handlePointerMove = (e) => {
    if (activeScreen !== 'playing') return;
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
      const ship = entitiesRef.current.ship;
      const step = 28;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        ship.targetX -= step;
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        ship.targetX += step;
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        spawnLaser();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeScreen, spawnLaser]);

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

  // Fit text inside option block
  const drawTextFit = (ctx, text, x, y, maxWidth, fontBaseSize) => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = fontBaseSize;
    ctx.font = `bold ${size}px monospace`;
    while (ctx.measureText(text).width > maxWidth && size > 8) {
      size -= 1;
      ctx.font = `bold ${size}px monospace`;
    }
    ctx.fillText(text, x, y);
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
    generateQuestion(0, words);
  };

  const handleExit = () => {
    if (onExit) onExit();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#070510] text-amber-400">
        <div className="text-xl font-mono tracking-widest animate-pulse">
          LOADING TRIVIA PROTOCOL...
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
          <div className="absolute top-18 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] flex flex-col items-center justify-center py-2.5 px-4 rounded-2xl bg-slate-950/85 border border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.12),inset_0_0_10px_rgba(245,158,11,0.08)] text-center z-20 pointer-events-auto">
            <div className="text-[8px] font-mono text-amber-500/40 tracking-widest uppercase">
              TARGET WORD // HEDEF KELİME
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.45)] break-all px-2 mt-0.5 leading-tight">
              {currentQuestion.questionText}
            </h2>
            
            {currentQuestion.romanization && (
              <div className="text-[10px] font-mono text-cyan-400 mt-0.5 tracking-wider animate-pulse">
                [{currentQuestion.romanization}]
              </div>
            )}

            {/* Time progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-amber-500/80 transition-all duration-100" style={{ width: `${timeLeft * 10}%`, boxShadow: '0 0 8px #f59e0b' }} />
          </div>
        )}

        {/* Space Shooter Canvas Arena */}
        <div className="flex-1 w-full relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 my-3 pointer-events-auto">
          <canvas
            ref={canvasRef}
            className="w-full h-full block touch-none cursor-crosshair"
            onPointerDown={(e) => {
              handleWarmUp();
              handlePointerMove(e);
              spawnLaser();
            }}
            onPointerMove={handlePointerMove}
          />

          {/* Combo overlay */}
          {activeScreen === 'playing' && combo > 1 && (
            <div className="absolute bottom-4 left-4 text-xs font-mono text-cyan-400 tracking-wider flex items-center gap-1.5 animate-bounce bg-cyan-950/50 border border-cyan-500/30 px-3 py-1 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.15)] pointer-events-none">
              <Award className="w-3.5 h-3.5 fill-cyan-500" />
              COMBO: x{combo}!
            </div>
          )}
        </div>

        {/* Footer info/controls on mobile */}
        {activeScreen === 'playing' && (
          <div className="w-full text-center text-[9px] font-mono text-slate-500 tracking-widest mt-0">
            MEMOLANDUM TRIVIA ENGINE v2.0 // DIRECT STEERING READY
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
                 {learnedWords.map((wordPair, idx) => (
                    <li key={idx} className="text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/50 text-xs font-mono font-bold">
                      {wordPair}
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
