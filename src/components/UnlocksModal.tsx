import React from 'react';
import { UnlockItem, PaletteThemeId, SoundThemeId } from '../types';
import { PALETTES } from '../rendering/themes';
import { AudioEngine } from '../core/AudioEngine';
import { X, Lock, Check, Sparkles, Volume2, Palette } from 'lucide-react';

interface UnlocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlocks: UnlockItem[];
  currentPalette: PaletteThemeId;
  currentSound: SoundThemeId;
  onSelectPalette: (id: PaletteThemeId) => void;
  onSelectSound: (id: SoundThemeId) => void;
}

export const UnlocksModal: React.FC<UnlocksModalProps> = ({
  isOpen,
  onClose,
  unlocks,
  currentPalette,
  currentSound,
  onSelectPalette,
  onSelectSound
}) => {
  if (!isOpen) return null;

  const audioEngine = AudioEngine.getInstance();

  const isPaletteUnlocked = (id: PaletteThemeId): boolean => {
    if (id === 'default') return true;
    const unlockId = id === 'neon' ? 'theme_neon' : id === 'mono' ? 'theme_mono' : 'theme_space';
    const item = unlocks.find(u => u.id === unlockId);
    return item ? item.unlocked : false;
  };

  const isSoundUnlocked = (id: SoundThemeId): boolean => {
    if (id === 'default') return true;
    const unlockId = id === 'crystal' ? 'sound_crystal' : 'sound_retro';
    const item = unlocks.find(u => u.id === unlockId);
    return item ? item.unlocked : false;
  };

  const handleTestSound = (themeId: SoundThemeId, e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = audioEngine.getSoundTheme();
    audioEngine.setSoundTheme(themeId);
    audioEngine.playNote(392.00, 0.4);
    setTimeout(() => audioEngine.setSoundTheme(prev), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0c0e16] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white tracking-wide">Galeria & Desbloqueáveis</h2>
              <p className="text-xs text-white/50">Personalize a identidade audiovisual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Paletas Visuais */}
        <div className="my-5">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-white/60" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white/70">Paletas de Cores</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(PALETTES) as PaletteThemeId[]).map((paletteId) => {
              const pal = PALETTES[paletteId];
              const unlocked = isPaletteUnlocked(paletteId);
              const isActive = currentPalette === paletteId;
              const unlockInfo = unlocks.find(
                u => u.id === (paletteId === 'neon' ? 'theme_neon' : paletteId === 'mono' ? 'theme_mono' : 'theme_space')
              );

              return (
                <div
                  key={paletteId}
                  onClick={() => unlocked && onSelectPalette(paletteId)}
                  className={`relative p-3.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-[#181d2e] border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                      : unlocked
                      ? 'bg-[#131622] border-white/10 hover:border-white/20 cursor-pointer'
                      : 'bg-[#0f111a] border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      {pal.name}
                      {isActive && <Check className="w-4 h-4 text-cyan-400" />}
                    </span>
                    {!unlocked && <Lock className="w-3.5 h-3.5 text-white/40" />}
                  </div>

                  {/* 4-Color Swatch Preview */}
                  <div className="flex items-center gap-1.5 mb-2.5">
                    {pal.pads.map((pad) => (
                      <div
                        key={pad.id}
                        className="w-5 h-5 rounded-md shadow-sm"
                        style={{ backgroundColor: pad.activeColor }}
                      />
                    ))}
                  </div>

                  <p className="text-[11px] text-white/50 leading-relaxed">
                    {unlocked ? pal.description : `Bloqueado: ${unlockInfo?.conditionDescription || 'Conquista especial'}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Temas Sonoros */}
        <div className="my-5 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-white/60" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white/70">Síntese Sonora</h3>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: 'default' as SoundThemeId,
                name: 'Senóide Pura (Padrão)',
                desc: 'Ondas senoidais suaves com envelope ADSR acústico nostálgico.',
                condition: 'Disponível inicialmente'
              },
              {
                id: 'crystal' as SoundThemeId,
                name: 'Crystal Resonance',
                desc: 'Senóides com harmônicos etéreos de brilho e reverberação.',
                condition: 'Jogar 5 partidas no modo Zen'
              },
              {
                id: 'retro' as SoundThemeId,
                name: 'Retro 8-Bit Arcade',
                desc: 'Onda quadrada clássica inspirada nos microprocessadores dos anos 80.',
                condition: 'Jogar 1 partida em cada um dos 4 modos'
              }
            ].map((soundItem) => {
              const unlocked = isSoundUnlocked(soundItem.id);
              const isActive = currentSound === soundItem.id;

              return (
                <div
                  key={soundItem.id}
                  onClick={() => unlocked && onSelectSound(soundItem.id)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-[#181d2e] border-cyan-400 ring-1 ring-cyan-400/50'
                      : unlocked
                      ? 'bg-[#131622] border-white/10 hover:border-white/20 cursor-pointer'
                      : 'bg-[#0f111a] border-white/5 opacity-60'
                  }`}
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-white">{soundItem.name}</span>
                      {isActive && <Check className="w-4 h-4 text-cyan-400" />}
                      {!unlocked && <Lock className="w-3.5 h-3.5 text-white/40" />}
                    </div>
                    <p className="text-xs text-white/50">{unlocked ? soundItem.desc : `Bloqueado: ${soundItem.condition}`}</p>
                  </div>

                  <button
                    onClick={(e) => handleTestSound(soundItem.id, e)}
                    title="Testar nota"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
