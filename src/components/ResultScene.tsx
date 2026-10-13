import React, { useEffect, useState } from 'react';
import { GameMode, PaletteDefinition } from '../types';
import { AudioEngine } from '../core/AudioEngine';
import { RotateCcw, Home, Trophy, Sparkles, Zap, Clock } from 'lucide-react';

interface ResultSceneProps {
  score: number;
  previousBest: number;
  isNewRecord: boolean;
  mode: GameMode;
  palette: PaletteDefinition;
  timeElapsedMs?: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

const MODE_NAMES: Record<GameMode, string> = {
  classic: 'Clássico',
  liveboard: 'Tabuleiro Vivo',
  reverse: 'Eco Reverso',
  zen: 'Zen'
};

export const ResultScene: React.FC<ResultSceneProps> = ({
  score,
  previousBest,
  isNewRecord,
  mode,
  palette,
  timeElapsedMs,
  onPlayAgain,
  onBackToMenu
}) => {
  const [showContent, setShowContent] = useState(false);
  const audioEngine = AudioEngine.getInstance();

  useEffect(() => {
    // Aesthetics of silence: brief pause before revealing the result
    const timer = setTimeout(() => {
      setShowContent(true);
      if (isNewRecord && score > 0) {
        audioEngine.playRecordBeat();
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [isNewRecord, score, audioEngine]);

  // Keyboard shortcut: Space or Enter to play again, Esc to menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onPlayAgain();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBackToMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayAgain, onBackToMenu]);

  const formatTime = (ms?: number) => {
    if (!ms) return null;
    const seconds = Math.floor(ms / 1000);
    const millis = Math.floor((ms % 1000) / 100);
    return `${seconds}.${millis}s`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full max-w-lg mx-auto px-4 py-8 text-white select-none">
      {/* Ambient background glow for records */}
      {isNewRecord && (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-cyan-500/10 pointer-events-none blur-3xl" />
      )}

      <div
        className={`w-full bg-[#0c0f18] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        {/* Mode Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/60 mb-6">
          <span>Modo {MODE_NAMES[mode]}</span>
        </div>

        {/* New Record Banner */}
        {isNewRecord && score > 0 ? (
          <div className="flex items-center justify-center gap-2 mb-4 text-amber-400 font-bold text-sm tracking-widest font-mono uppercase animate-bounce">
            <Trophy className="w-4 h-4" />
            <span>Novo Recorde Pessoal</span>
            <Sparkles className="w-4 h-4" />
          </div>
        ) : (
          <div className="text-xs uppercase font-mono tracking-widest text-white/40 mb-3">
            Sequência Alcançada
          </div>
        )}

        {/* Big Score Display */}
        <div className="my-2">
          <span className="text-7xl sm:text-8xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60">
            {score}
          </span>
          <span className="block text-xs font-mono text-white/40 mt-1">passos memorizados</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 my-6 pt-6 border-t border-white/5">
          <div className="bg-[#121522] rounded-2xl p-3.5 border border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">
              Recorde Anterior
            </span>
            <span className="text-xl font-bold font-display text-white/80">
              {previousBest > 0 ? previousBest : '—'}
            </span>
          </div>

          <div className="bg-[#121522] rounded-2xl p-3.5 border border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">
              Tempo de Jogo
            </span>
            <span className="text-xl font-bold font-display text-cyan-400">
              {formatTime(timeElapsedMs) || '—'}
            </span>
          </div>
        </div>

        {/* Philosophy Reflection Quote */}
        <p className="text-xs font-mono text-white/40 my-6 italic">
          &ldquo;O Ruído eventualmente impõe esquecimento. A memória é construída passo a passo.&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
          <button
            onClick={onPlayAgain}
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-black font-extrabold text-sm tracking-wider uppercase font-display shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Jogar Novamente
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm tracking-wider uppercase font-display transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Menu
          </button>
        </div>

        <div className="text-[10px] font-mono text-white/30 mt-4">
          Pressione [Espaço] para reiniciar ou [Esc] para o menu
        </div>
      </div>
    </div>
  );
};
