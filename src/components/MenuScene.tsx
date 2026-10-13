import React, { useState } from 'react';
import { GameMode, PaletteDefinition, PlayerStats } from '../types';
import { CanvasBoard } from '../rendering/CanvasBoard';
import { AudioEngine } from '../core/AudioEngine';
import { Play, Sparkles, Activity, Settings, Volume2, Maximize2, Trophy, RotateCcw, Compass, Shuffle } from 'lucide-react';

interface MenuSceneProps {
  palette: PaletteDefinition;
  stats: PlayerStats;
  onStartGame: (mode: GameMode) => void;
  onOpenStats: () => void;
  onOpenUnlocks: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
}

const MODES: Array<{
  id: GameMode;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  tagColor: string;
  borderColor: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'classic',
    name: 'Clássico',
    subtitle: 'O ARCADE',
    icon: Play,
    tagColor: 'text-red-400 bg-red-400/10 border-red-400/20',
    borderColor: 'hover:border-red-500/40',
    badge: 'Memória Pura',
    description: 'Sequência progressiva com ritmo acelerado e eco do recorde pessoal.'
  },
  {
    id: 'liveboard',
    name: 'Tabuleiro Vivo',
    subtitle: 'A INSTABILIDADE',
    icon: Shuffle,
    tagColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    borderColor: 'hover:border-amber-500/40',
    badge: 'Adaptação',
    description: 'As cores mudam de lugar a cada rodada. Teste de mapeamento espacial.'
  },
  {
    id: 'reverse',
    name: 'Eco Reverso',
    subtitle: 'O ESPELHO',
    icon: RotateCcw,
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    borderColor: 'hover:border-blue-500/40',
    badge: 'Inversão Cognitiva',
    description: 'Observe a sequência normal e reproduza de trás para frente.'
  },
  {
    id: 'zen',
    name: 'Zen',
    subtitle: 'A MEMÓRIA FLUTUA',
    icon: Compass,
    tagColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    borderColor: 'hover:border-emerald-500/40',
    badge: 'Contemplativo',
    description: 'Sem tempo ou punição. Puro prazer sensorial e harmonia acústica.'
  }
];

export const MenuScene: React.FC<MenuSceneProps> = ({
  palette,
  stats,
  onStartGame,
  onOpenStats,
  onOpenUnlocks,
  onOpenSettings,
  onToggleFullscreen
}) => {
  const [activePreviewPad, setActivePreviewPad] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');

  const audioEngine = AudioEngine.getInstance();

  const handlePadPress = (padIdx: number) => {
    setActivePreviewPad(padIdx);
    const freq = palette.pads[padIdx].freq;
    audioEngine.playNote(freq, 0.35);
  };

  const handlePadRelease = () => {
    setActivePreviewPad(null);
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen w-full max-w-5xl mx-auto px-4 py-6 text-white select-none">
      {/* Top Utility Bar */}
      <header className="w-full flex items-center justify-between py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#22FF50] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest text-white/50 uppercase">ECO · ONLINE</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStats}
            title="Evolução e Estatísticas"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all flex items-center gap-2 text-xs font-mono"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Evolução</span>
          </button>

          <button
            onClick={onOpenUnlocks}
            title="Desbloqueáveis e Paletas"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all flex items-center gap-2 text-xs font-mono"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Galeria</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Ajustes"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleFullscreen}
            title="Tela Cheia"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Hero & Machine Wake-up Area */}
      <main className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 my-auto py-6">
        {/* Left: Interactive Toy Preview */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Ambient Background Aura */}
            <div className="absolute -inset-6 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <CanvasBoard
              palette={palette}
              activePad={activePreviewPad}
              padSlotMap={[0, 1, 2, 3]}
              onPadPress={handlePadPress}
              onPadRelease={handlePadRelease}
              interactive={true}
              showKeyHints={true}
              size={320}
              className="relative z-10"
            />
          </div>
          <span className="text-[11px] font-mono text-white/40 mt-3 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-white/30" />
            Toque nos pads para testar os timbres
          </span>
        </div>

        {/* Right: Brand Title & Mode Selector */}
        <div className="w-full max-w-md flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* Logo */}
          <div className="mb-6">
            <h1 className="text-5xl sm:text-6xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70">
              ECO
            </h1>
            <p className="text-xs sm:text-sm text-white/60 tracking-wider font-mono mt-1">
              Brinquedo de memória & reflexo sensorial
            </p>
          </div>

          {/* Mode Selection Cards */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              const record = stats.bestScore[mode.id] || 0;

              return (
                <div
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#151928] border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                      : `bg-[#0f121c] border-white/10 ${mode.borderColor} hover:bg-[#121624]`
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-white/60'}`} />
                      <span className="font-bold text-sm text-white">{mode.name}</span>
                    </div>
                    {record > 0 && (
                      <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {record}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-white/50 leading-snug line-clamp-2">
                    {mode.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Start Action Button */}
          <button
            onClick={() => onStartGame(selectedMode)}
            className="w-full group relative overflow-hidden py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-black font-extrabold text-base tracking-wider uppercase font-display shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5 fill-current text-black" />
            Iniciar Partida · {MODES.find(m => m.id === selectedMode)?.name}
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/5 text-[11px] font-mono text-white/40 gap-2">
        <div className="flex items-center gap-4">
          <span>Recorde Geral: <strong className="text-amber-400">{Math.max(0, ...(Object.values(stats.bestScore) as number[]))}</strong></span>
          <span>Sessões: <strong>{(Object.values(stats.totalGames) as number[]).reduce((a, b) => a + b, 0)}</strong></span>
        </div>
        <div className="text-white/30">
          Atalhos: [1-4] ou [A, S, Z, X] · Teclado / Touch
        </div>
      </footer>
    </div>
  );
};
