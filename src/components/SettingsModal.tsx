import React from 'react';
import { SoundThemeId } from '../types';
import { X, Volume2, VolumeX, Smartphone, Keyboard, Maximize2, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: (enabled: boolean) => void;
  showKeyHints: boolean;
  onToggleKeyHints: (enabled: boolean) => void;
  onToggleFullscreen: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  hapticsEnabled,
  onToggleHaptics,
  showKeyHints,
  onToggleKeyHints,
  onToggleFullscreen
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0c0e16] border border-white/10 rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white tracking-wide">Ajustes</h2>
              <p className="text-xs text-white/50">Preferências do dispositivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 space-y-4">
          {/* Audio Volume */}
          <div className="p-3.5 rounded-2xl bg-[#131622] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/90 flex items-center gap-2">
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                Volume do Áudio
              </span>
              <button
                onClick={onToggleMute}
                className="text-xs font-mono px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white/80 transition-colors"
              >
                {isMuted ? 'Desmutar' : 'Mutar'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Haptic Vibration */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#131622] border border-white/5">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-white/70" />
              <div>
                <span className="text-sm font-medium text-white block">Vibração Tátil</span>
                <span className="text-xs text-white/40">Feedback háptico ao tocar (Mobile)</span>
              </div>
            </div>
            <button
              onClick={() => onToggleHaptics(!hapticsEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                hapticsEnabled ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  hapticsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Key Hints */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#131622] border border-white/5">
            <div className="flex items-center gap-3">
              <Keyboard className="w-4 h-4 text-white/70" />
              <div>
                <span className="text-sm font-medium text-white block">Dicas de Teclas</span>
                <span className="text-xs text-white/40">Exibir atalhos 1-4 nos botões</span>
              </div>
            </div>
            <button
              onClick={() => onToggleKeyHints(!showKeyHints)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                showKeyHints ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  showKeyHints ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
            Alternar Tela Cheia
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
