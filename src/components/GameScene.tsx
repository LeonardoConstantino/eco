import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, GameState, PaletteDefinition, GameRecord, GameSession } from '../types';
import { CanvasBoard } from '../rendering/CanvasBoard';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { AudioEngine } from '../core/AudioEngine';
import { SequenceEngine } from '../game/SequenceEngine';
import { DifficultyController } from '../game/DifficultyController';
import { StorageService } from '../persistence/DB';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, Eye, HelpCircle, Shuffle, Trophy } from 'lucide-react';

interface GameSceneProps {
  mode: GameMode;
  palette: PaletteDefinition;
  previousBest: number;
  hapticsEnabled: boolean;
  showKeyHints: boolean;
  onFinishGame: (finalScore: number, isNewRecord: boolean, timeElapsedMs: number) => void;
  onBackToMenu: () => void;
}

const MODE_LABELS: Record<GameMode, string> = {
  classic: 'Clássico',
  liveboard: 'Tabuleiro Vivo',
  reverse: 'Eco Reverso',
  zen: 'Zen'
};

export const GameScene: React.FC<GameSceneProps> = ({
  mode,
  palette,
  previousBest,
  hapticsEnabled,
  showKeyHints,
  onFinishGame,
  onBackToMenu
}) => {
  const [gameState, setGameState] = useState<GameState>('SHOWING');
  const [activePad, setActivePad] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [inputStep, setInputStep] = useState<number>(0);
  const [currentSequenceLength, setCurrentSequenceLength] = useState<number>(1);
  const [timeRemainingPercent, setTimeRemainingPercent] = useState<number>(100);
  const [padSlotMap, setPadSlotMap] = useState<number[]>([0, 1, 2, 3]);
  const [isReshuffling, setIsReshuffling] = useState<boolean>(false);
  const [reshuffleWarning, setReshuffleWarning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const sequenceEngineRef = useRef<SequenceEngine>(new SequenceEngine());
  const audioEngine = AudioEngine.getInstance();

  const gameStartTimeRef = useRef<number>(Date.now());
  const sessionSavedRef = useRef<boolean>(false);
  const roundScoreRef = useRef<number>(0);
  const currentSequenceLengthRef = useRef<number>(1);
  const inputTimerRef = useRef<number | null>(null);
  const playbackTimersRef = useRef<number[]>([]);
  const isComponentMounted = useRef<boolean>(true);
  const isPlayingBackRef = useRef<boolean>(false);

  useEffect(() => {
    roundScoreRef.current = roundScore;
  }, [roundScore]);

  useEffect(() => {
    currentSequenceLengthRef.current = currentSequenceLength;
  }, [currentSequenceLength]);

  // Persist session to database
  const saveAndPersistSession = useCallback(async (customScore?: number) => {
    if (sessionSavedRef.current) return;
    sessionSavedRef.current = true;

    const finalScore = customScore !== undefined ? customScore : roundScoreRef.current;
    const timeElapsedMs = Math.max(300, Date.now() - gameStartTimeRef.current);

    const session: GameSession = {
      mode,
      score: finalScore,
      date: Date.now(),
      durationMs: timeElapsedMs,
      sequenceLength: currentSequenceLengthRef.current
    };

    await StorageService.saveSession(session);

    if (finalScore > 0) {
      const record: GameRecord = {
        mode,
        score: finalScore,
        date: Date.now(),
        timeMs: timeElapsedMs
      };
      await StorageService.saveRecord(record);
    }

    const updatedStats = await StorageService.getPlayerStats();
    await StorageService.checkAndGrantUnlocks(updatedStats);
  }, [mode]);

  // Trigger haptic vibration
  const triggerHaptic = useCallback((duration = 25) => {
    if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Ignored
      }
    }
  }, [hapticsEnabled]);

  // Clear all pending playback timers
  const clearPlaybackTimers = useCallback(() => {
    playbackTimersRef.current.forEach(timer => clearTimeout(timer));
    playbackTimersRef.current = [];
  }, []);

  // Clear timeout timer
  const clearInputTimer = useCallback(() => {
    if (inputTimerRef.current) {
      clearInterval(inputTimerRef.current);
      inputTimerRef.current = null;
    }
  }, []);

  // Live board reshuffling logic
  const performReshuffle = useCallback(() => {
    setIsReshuffling(true);
    // Shuffle slots [0, 1, 2, 3] randomly
    const newSlots = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    setPadSlotMap(newSlots);

    setTimeout(() => {
      if (isComponentMounted.current) {
        setIsReshuffling(false);
      }
    }, 450);
  }, []);

  // Start input phase with countdown timer
  const startInputPhase = useCallback((seqLength: number) => {
    setGameState('INPUT');
    setInputStep(0);
    setTimeRemainingPercent(100);

    const totalTimeout = DifficultyController.getInputTimeout(seqLength, mode);
    if (totalTimeout > 0) {
      const startTime = Date.now();
      clearInputTimer();

      inputTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1 - elapsed / totalTimeout);
        setTimeRemainingPercent(remaining * 100);

        if (remaining <= 0) {
          clearInputTimer();
          handleTimeout();
        }
      }, 50);
    }
  }, [mode, clearInputTimer]);

  // Playback the sequence to the player
  const playSequence = useCallback((sequence: number[]) => {
    clearPlaybackTimers();
    clearInputTimer();
    setGameState('SHOWING');
    isPlayingBackRef.current = true;
    setActivePad(null);

    const interval = DifficultyController.getShowInterval(sequence.length, mode);
    const flashDuration = DifficultyController.getFlashDuration(sequence.length, mode);

    // Initial buffer before sequence starts
    const initialDelay = 500;

    sequence.forEach((padIdx, step) => {
      // Pad Light ON timer
      const onTimer = window.setTimeout(() => {
        if (!isComponentMounted.current) return;
        setActivePad(padIdx);
        const freq = palette.pads[padIdx].freq;
        audioEngine.playNote(freq, flashDuration / 1000);
      }, initialDelay + step * interval);

      playbackTimersRef.current.push(onTimer);

      // Pad Light OFF timer
      const offTimer = window.setTimeout(() => {
        if (!isComponentMounted.current) return;
        setActivePad(null);
      }, initialDelay + step * interval + flashDuration);

      playbackTimersRef.current.push(offTimer);
    });

    // Sequence completion -> switch to input phase
    const endTimer = window.setTimeout(() => {
      if (!isComponentMounted.current) return;
      isPlayingBackRef.current = false;
      startInputPhase(sequence.length);
    }, initialDelay + sequence.length * interval + 150);

    playbackTimersRef.current.push(endTimer);
  }, [mode, palette, audioEngine, clearPlaybackTimers, clearInputTimer, startInputPhase]);

  // Start a new round
  const nextRound = useCallback((isFirst = false) => {
    clearPlaybackTimers();
    clearInputTimer();

    let seq: number[];
    if (isFirst) {
      const startLen = mode === 'reverse' ? 2 : 1;
      seq = sequenceEngineRef.current.reset(startLen);
    } else {
      seq = sequenceEngineRef.current.addStep();
    }

    const currentLen = seq.length;
    setCurrentSequenceLength(currentLen);
    setRoundScore(currentLen - 1);

    // Check Live Board Reshuffle
    if (mode === 'liveboard') {
      if (DifficultyController.shouldReshuffle(currentLen, mode)) {
        setReshuffleWarning(true);
        setTimeout(() => {
          performReshuffle();
          setReshuffleWarning(false);
          playSequence(seq);
        }, 600);
        return;
      }
    }

    playSequence(seq);
  }, [mode, performReshuffle, playSequence, clearPlaybackTimers, clearInputTimer]);

  // Handle Timeout
  const handleTimeout = () => {
    handleGameOver();
  };

  // Handle Game Over
  const handleGameOver = async () => {
    clearPlaybackTimers();
    clearInputTimer();
    setGameState('RESULT');
    audioEngine.playError();
    triggerHaptic(60);

    if (particleSystemRef.current) {
      particleSystemRef.current.emitErrorDispersal();
    }

    const finalScore = roundScore;
    const isNewRecord = finalScore > previousBest;
    const timeElapsedMs = Date.now() - gameStartTimeRef.current;

    await saveAndPersistSession(finalScore);
    onFinishGame(finalScore, isNewRecord, timeElapsedMs);
  };

  // Handle Exit back to Menu
  const handleExitToMenu = async () => {
    clearPlaybackTimers();
    clearInputTimer();
    await saveAndPersistSession();
    onBackToMenu();
  };

  // Handle Manual Zen Session Conclusion
  const handleFinishZenSession = async () => {
    clearPlaybackTimers();
    clearInputTimer();
    setGameState('RESULT');
    audioEngine.playZenLoopCompletion();

    const finalScore = roundScore;
    const isNewRecord = finalScore > previousBest;
    const timeElapsedMs = Date.now() - gameStartTimeRef.current;

    await saveAndPersistSession(finalScore);
    onFinishGame(finalScore, isNewRecord, timeElapsedMs);
  };

  // Handle Pad Press by Player
  const handlePadPress = (padIdx: number) => {
    if (gameState !== 'INPUT' || isPlayingBackRef.current) return;

    setActivePad(padIdx);
    const freq = palette.pads[padIdx].freq;
    audioEngine.playNote(freq, 0.28);
    triggerHaptic(20);

    const validation = sequenceEngineRef.current.validateInput(padIdx, mode);

    if (!validation.valid) {
      if (mode === 'zen') {
        // Zen mode does not fail: soft reset current loop and continue peacefully
        audioEngine.playNote(180, 0.2);
        sequenceEngineRef.current.resetInputIndex();
        setInputStep(0);
        setTimeout(() => {
          playSequence(sequenceEngineRef.current.getSequence());
        }, 400);
        return;
      }

      // Game over on wrong input
      handleGameOver();
      return;
    }

    // Correct input step
    const nextStep = inputStep + 1;
    setInputStep(nextStep);

    if (validation.isSequenceComplete) {
      clearInputTimer();

      if (mode === 'zen') {
        // Zen reward chime
        audioEngine.playZenLoopCompletion();
      }

      // Check if player just beat their previous record
      const currentScore = sequenceEngineRef.current.getSequenceLength();
      if (currentScore > previousBest && currentScore === previousBest + 1) {
        if (particleSystemRef.current) {
          particleSystemRef.current.emitRecordCelebration(palette.pads.map(p => p.activeColor));
        }
      }

      // Brief victory pause before starting next round
      setTimeout(() => {
        if (isComponentMounted.current && gameState !== 'PAUSED') {
          nextRound(false);
        }
      }, 400);
    }
  };

  const handlePadRelease = () => {
    if (gameState === 'INPUT') {
      setActivePad(null);
    }
  };

  // Pause / Resume
  const handleTogglePause = () => {
    if (gameState === 'PAUSED') {
      setGameState('INPUT');
    } else if (gameState === 'INPUT' || gameState === 'SHOWING') {
      clearPlaybackTimers();
      clearInputTimer();
      setGameState('PAUSED');
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleTogglePause();
        return;
      }

      if (gameState !== 'INPUT') return;

      let targetPad: number | null = null;

      // Key mappings (1-4, A/S/Z/X, or Arrow Keys)
      if (e.key === '1' || e.key === 'a' || e.key === 'A' || e.key === 'q' || e.key === 'Q') {
        targetPad = 0;
      } else if (e.key === '2' || e.key === 's' || e.key === 'S' || e.key === 'w' || e.key === 'W') {
        targetPad = 1;
      } else if (e.key === '3' || e.key === 'z' || e.key === 'Z' || e.key === 'd' || e.key === 'D') {
        targetPad = 2;
      } else if (e.key === '4' || e.key === 'x' || e.key === 'X' || e.key === 'f' || e.key === 'F') {
        targetPad = 3;
      }

      if (targetPad !== null) {
        handlePadPress(targetPad);
      }
    };

    const handleKeyUp = () => {
      handlePadRelease();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handlePadPress, handleTogglePause]);

  // Initialize Game on Mount
  useEffect(() => {
    isComponentMounted.current = true;
    gameStartTimeRef.current = Date.now();
    sessionSavedRef.current = false;
    nextRound(true);

    return () => {
      isComponentMounted.current = false;
      clearPlaybackTimers();
      clearInputTimer();
      // Ensure session is saved if unmounted without exiting via menu
      saveAndPersistSession();
    };
  }, [saveAndPersistSession, nextRound, clearPlaybackTimers, clearInputTimer]);

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen w-full max-w-2xl mx-auto px-4 py-4 text-white select-none">
      {/* Top Game Bar HUD */}
      <header className="w-full flex items-center justify-between py-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExitToMenu}
            title="Salvar e voltar ao menu"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-white/90">
                {MODE_LABELS[mode]}
              </span>
              {mode === 'reverse' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  ↩ Reverso
                </span>
              )}
              {mode === 'zen' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Contemplativo
                </span>
              )}
            </div>
            {previousBest > 0 && (
              <span className="text-[10px] font-mono text-white/40 block">
                Eco do recorde: <strong className="text-amber-400">{previousBest}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Center Sequence Counter */}
        <div className="text-center">
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 block">
            {mode === 'zen' ? 'Ciclo' : 'Sequência'}
          </span>
          <span className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide">
            {String(currentSequenceLength).padStart(2, '0')}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(audioEngine.toggleMute())}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={handleTogglePause}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="w-full flex-1 flex flex-col items-center justify-center my-auto py-4">
        {/* State / Hint Banner */}
        <div className="h-8 flex items-center justify-center mb-3">
          {reshuffleWarning ? (
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-400/30 animate-pulse">
              <Shuffle className="w-3.5 h-3.5" />
              Reorganizando tabuleiro...
            </div>
          ) : gameState === 'SHOWING' ? (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-400/20">
              <Eye className="w-3.5 h-3.5 animate-pulse" />
              Observe a sequência
            </div>
          ) : gameState === 'INPUT' ? (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-400/20">
              <span>
                {mode === 'reverse'
                  ? `Reproduza invertido (Passo ${inputStep + 1} de ${currentSequenceLength}) ↩`
                  : mode === 'zen'
                  ? `Harmonize o fluxo (${inputStep + 1} / ${currentSequenceLength})`
                  : `Reproduza a sequência (${inputStep + 1} / ${currentSequenceLength})`}
              </span>
            </div>
          ) : null}
        </div>

        {/* Interactive Pad Canvas */}
        <div className="relative">
          <CanvasBoard
            palette={palette}
            activePad={activePad}
            padSlotMap={padSlotMap}
            isReshuffling={isReshuffling}
            onPadPress={handlePadPress}
            onPadRelease={handlePadRelease}
            interactive={gameState === 'INPUT'}
            showKeyHints={showKeyHints}
            particleSystemRef={particleSystemRef}
            size={360}
          />
        </div>

        {/* Timeout Progress Bar (Only during Input Phase and Non-Zen) */}
        <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden mt-6">
          {gameState === 'INPUT' && mode !== 'zen' && (
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                timeRemainingPercent > 40
                  ? 'bg-cyan-400 shadow-[0_0_8px_#2B8CFF]'
                  : 'bg-red-400 shadow-[0_0_8px_#FF2A2A]'
              }`}
              style={{ width: `${timeRemainingPercent}%` }}
            />
          )}
        </div>
      </main>

      {/* Footer / Echo Ghost Marker */}
      <footer className="w-full flex items-center justify-between py-3 border-t border-white/5 text-[11px] font-mono text-white/40">
        <div className="flex items-center gap-2">
          {previousBest > 0 ? (
            <span>
              {currentSequenceLength >= previousBest ? (
                <span className="text-amber-400 font-bold animate-pulse">
                  ⚡ Você ultrapassou seu recorde!
                </span>
              ) : (
                <span>
                  Distância do recorde: <strong className="text-white/70">{previousBest - currentSequenceLength + 1}</strong>
                </span>
              )}
            </span>
          ) : (
            <span>Construindo seu primeiro eco</span>
          )}
        </div>

        <div className="text-white/30 hidden sm:block">
          [1-4] ou clique · [P] Pausar
        </div>
      </footer>

      {/* Pause Modal Overlay */}
      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0c0f18] border border-white/10 rounded-3xl p-6 text-center max-w-xs w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              {mode === 'zen' ? 'Sessão Zen' : 'Partida Pausada'}
            </h3>
            <p className="text-xs font-mono text-white/50">
              {mode === 'zen'
                ? `Ciclo alcançado: ${currentSequenceLength}`
                : `Sequência atual: ${currentSequenceLength}`}
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleTogglePause}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-display text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Continuar
              </button>

              {mode === 'zen' && (
                <button
                  onClick={handleFinishZenSession}
                  className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  Concluir Sessão Zen
                </button>
              )}

              <button
                onClick={handleExitToMenu}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Sair para o Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
