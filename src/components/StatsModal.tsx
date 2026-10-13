import React from 'react';
import { PlayerStats, GameMode } from '../types';
import { X, Trophy, Activity, Zap, Play, Flame } from 'lucide-react';

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
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0c0e16] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
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
