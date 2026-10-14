import React, { useEffect, useState } from 'react';
import { GameMode, PaletteDefinition } from '../types';
import { AudioEngine } from '../core/AudioEngine';
import { RotateCcw, Home, Trophy, Sparkles, Zap, Clock, Share2, Check } from 'lucide-react';
import { generateGameResultShareText, shareContent } from '../utils/shareUtils';

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
  const [copyFeedback, setCopyFeedback] = useState(false);
  const audioEngine = AudioEngine.getInstance();

  const handleShareResult = async () => {
    const text = generateGameResultShareText(score, MODE_NAMES[mode], isNewRecord);
    const result = await shareContent('Meu Resultado no ECO', text);
    if (result === 'copied' || result === 'shared') {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }
  };

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
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-8 text-white select-none">
      {/* Ambient background glow for records */}
      {isNewRecord && (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-cyan-500/10 pointer-events-none blur-3xl" />
      )}

      <div
        className={`w-full bg-[#0c0f18] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl text-center transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        {/* Mode Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/60 mb-3 sm:mb-6">
          <span>Modo {MODE_NAMES[mode]}</span>
        </div>

        {/* New Record Banner */}
        {isNewRecord && score > 0 ? (
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4 text-amber-400 font-bold text-xs sm:text-sm tracking-widest font-mono uppercase animate-bounce">
            <Trophy className="w-4 h-4" />
            <span>Novo Recorde Pessoal</span>
            <Sparkles className="w-4 h-4" />
          </div>
        ) : (
          <div className="text-[11px] sm:text-xs uppercase font-mono tracking-widest text-white/40 mb-2 sm:mb-3">
            Sequência Alcançada
          </div>
        )}

        {/* Big Score Display */}
        <div className="my-1 sm:my-2">
          <span className="text-6xl sm:text-8xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60">
            {score}
          </span>
          <span className="block text-[11px] sm:text-xs font-mono text-white/40 mt-0.5 sm:mt-1">passos memorizados</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-4 sm:my-6 pt-4 sm:pt-6 border-t border-white/5">
          <div className="bg-[#121522] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/5">
            <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-0.5 sm:mb-1">
              Recorde Anterior
            </span>
            <span className="text-lg sm:text-xl font-bold font-display text-white/80">
              {previousBest > 0 ? previousBest : '—'}
            </span>
          </div>

          <div className="bg-[#121522] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/5">
            <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-0.5 sm:mb-1">
              Tempo de Jogo
            </span>
            <span className="text-lg sm:text-xl font-bold font-display text-cyan-400">
              {formatTime(timeElapsedMs) || '—'}
            </span>
          </div>
        </div>

        {/* Philosophy Reflection Quote */}
        <p className="text-[11px] sm:text-xs font-mono text-white/40 my-3 sm:my-6 italic hidden sm:block">
          &ldquo;O Ruído eventualmente impõe esquecimento. A memória é construída passo a passo.&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 mt-3 sm:mt-4">
          <button
            onClick={onPlayAgain}
            className="w-full sm:flex-1 py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-black font-extrabold text-sm tracking-wider uppercase font-display shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Jogar Novamente
          </button>

          <button
            onClick={handleShareResult}
            className={`w-full sm:w-auto py-3.5 sm:py-4 px-5 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer text-sm font-semibold tracking-wider uppercase font-display ${
              copyFeedback
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-400/30 text-cyan-300 hover:text-cyan-200'
            }`}
          >
            {copyFeedback ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Compartilhar</span>
              </>
            )}
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full sm:w-auto py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm tracking-wider uppercase font-display transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Menu
          </button>
        </div>

        {copyFeedback && (
          <div className="mt-3 text-xs font-mono text-emerald-300 flex items-center justify-center gap-1.5 animate-fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resultado copiado com link do app para convidar amigos!</span>
          </div>
        )}

        <div className="text-[10px] font-mono text-white/30 mt-3 sm:mt-4 hidden sm:block">
          Pressione [Espaço] para reiniciar ou [Esc] para o menu
        </div>
      </div>
    </div>
  );
};
