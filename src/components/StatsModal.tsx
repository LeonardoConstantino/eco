import React, { useState } from 'react';
import { PlayerStats, GameMode } from '../types';
import { X, Trophy, Activity, Zap, Share2, Check, Copy, Send } from 'lucide-react';
import { generateEvolutionShareText, shareContent, getWhatsAppShareUrl } from '../utils/shareUtils';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
}

const MODE_NAMES: Record<GameMode, string> = {
  classic: 'Clássico',
  liveboard: 'Tabuleiro Vivo',
  reverse: 'Eco Reverso',
  zen: 'Zen'
};

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats }) => {
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const text = generateEvolutionShareText(stats);
    const result = await shareContent('Minha Evolução no ECO', text);
    if (result === 'copied' || result === 'shared') {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }
  };

  const handleWhatsApp = () => {
    const text = generateEvolutionShareText(stats);
    window.open(getWhatsAppShareUrl(text), '_blank');
  };

  const totalAllGames = (Object.values(stats.totalGames) as number[]).reduce((a, b) => a + b, 0);

  // Generate SVG points for evolution chart
  const sessions = [...stats.lastSessions].reverse(); // Oldest to newest
  const chartHeight = 110;
  const chartWidth = 380;
  const maxScore = Math.max(12, ...sessions.map(s => s.score));

  const points = sessions.map((session, index) => {
    const x = sessions.length <= 1 ? chartWidth / 2 : (index / (sessions.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (session.score / maxScore) * (chartHeight - 30) - 15;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0c0e16] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white tracking-wide">Evolução Pessoal</h2>
              <p className="text-xs text-white/50">Métricas de memória e reflexo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Stats Banner */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="bg-[#131622] border border-white/5 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">Partidas</span>
            <span className="text-2xl font-bold font-display text-white">{totalAllGames}</span>
          </div>
          <div className="bg-[#131622] border border-white/5 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">Maior Eco</span>
            <span className="text-2xl font-bold font-display text-amber-400">
              {Math.max(0, ...(Object.values(stats.bestScore) as number[]))}
            </span>
          </div>
          <div className="bg-[#131622] border border-white/5 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">Passos Gravados</span>
            <span className="text-2xl font-bold font-display text-cyan-400">{stats.totalSequencesCompleted}</span>
          </div>
        </div>

        {/* Evolution Chart */}
        <div className="bg-[#131622] border border-white/5 rounded-2xl p-4 my-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Trajetória dos Últimos Ecos
            </span>
            <span className="text-[11px] font-mono text-white/40">{sessions.length} sessões</span>
          </div>

          {sessions.length > 1 ? (
            <div className="w-full overflow-hidden flex flex-col items-center">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32 overflow-visible">
                {/* Horizontal Guide Lines */}
                <line x1="10" y1={chartHeight - 15} x2={chartWidth - 10} y2={chartHeight - 15} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="10" y1={chartHeight / 2} x2={chartWidth - 10} y2={chartHeight / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="10" y1="15" x2={chartWidth - 10} y2="15" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                {/* Line Path */}
                <polyline
                  fill="none"
                  stroke="#22FF50"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />

                {/* Gradient area under curve */}
                <polygon
                  fill="url(#chartGrad)"
                  points={`20,${chartHeight - 15} ${points} ${chartWidth - 20},${chartHeight - 15}`}
                />

                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22FF50" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#22FF50" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ) : (
            <div className="h-28 flex flex-col items-center justify-center text-center text-white/40 text-xs">
              <Activity className="w-6 h-6 mb-2 text-white/20" />
              Complete mais partidas para visualizar sua curva de aprendizado.
            </div>
          )}
        </div>

        {/* Per-Mode Breakdown */}
        <div className="space-y-2 mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-white/50 mb-2">Recordes por Modo</h3>
          {(['classic', 'liveboard', 'reverse', 'zen'] as GameMode[]).map((mode) => (
            <div key={mode} className="flex items-center justify-between p-3 rounded-xl bg-[#131622]/60 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${
                  mode === 'classic' ? 'bg-red-400' :
                  mode === 'liveboard' ? 'bg-amber-400' :
                  mode === 'reverse' ? 'bg-blue-400' : 'bg-emerald-400'
                }`} />
                <span className="text-sm font-medium text-white/90">{MODE_NAMES[mode]}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-white/40">
                  {stats.totalGames[mode]} {stats.totalGames[mode] === 1 ? 'partida' : 'partidas'}
                </span>
                <span className="text-amber-400 font-bold flex items-center gap-1 min-w-[36px] justify-end">
                  <Trophy className="w-3.5 h-3.5 text-amber-400/80" />
                  {stats.bestScore[mode] || 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Sessions List */}
        {stats.lastSessions.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-white/50 mb-2">Últimas Sessões</h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {stats.lastSessions.slice(0, 6).map((session, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      session.mode === 'classic' ? 'bg-red-500/20 text-red-300' :
                      session.mode === 'liveboard' ? 'bg-amber-500/20 text-amber-300' :
                      session.mode === 'reverse' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {MODE_NAMES[session.mode]}
                    </span>
                    <span className="text-white/50 text-[11px]">
                      {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-[11px]">
                      {Math.round(session.durationMs / 1000)}s
                    </span>
                    <span className="text-amber-400 font-bold">
                      {session.score} {session.score === 1 ? 'passo' : 'passos'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Evolution & Challenge Friends CTA */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#131a2e] to-purple-950/30 border border-cyan-500/30 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase tracking-wider text-cyan-400">
                <Share2 className="w-3.5 h-3.5" />
                Compartilhe sua Evolução
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                Convide amigos para desafiarem seus recordes e testarem a memória no ECO.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={handleShare}
              className="flex-1 min-w-[130px] py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-black font-extrabold text-xs tracking-wider uppercase font-display shadow-md shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>

            <button
              onClick={handleWhatsApp}
              title="Compartilhar no WhatsApp"
              className="py-2.5 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </button>
          </div>

          {copyFeedback && (
            <div className="mt-2 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 animate-fade-in">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Resumo da sua evolução e link do app copiados!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
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
