export type GameMode = 'classic' | 'liveboard' | 'reverse' | 'zen';

export type GameState = 'MENU' | 'SHOWING' | 'INPUT' | 'RESULT' | 'PAUSED';

export type SoundThemeId = 'default' | 'crystal' | 'retro';

export type PaletteThemeId = 'default' | 'neon' | 'mono' | 'space';

export interface PadTheme {
  id: number;
  name: string;
  noteName: string;
  freq: number;
  baseColor: string;
  activeColor: string;
  glowColor: string;
  glowRadius: number;
  glowAlpha: number;
  character: string; // "IMPULSO", "CONTINUIDADE", "PROFUNDIDADE", "ALERTA"
}

export interface PaletteDefinition {
  id: PaletteThemeId;
  name: string;
  description: string;
  pads: PadTheme[];
}

export interface GameRecord {
  id?: number;
  mode: GameMode;
  score: number;           // maximum sequence length reached
  timeMs?: number;         // time elapsed in ms
  date: number;            // Unix timestamp
}

export interface GameSession {
  id?: number;
  mode: GameMode;
  score: number;
  date: number;
  durationMs: number;
  sequenceLength: number;
}

export interface UnlockItem {
  id: string;              // 'theme_neon', 'theme_mono', 'theme_space', 'sound_crystal', 'sound_retro'
  type: 'palette' | 'sound';
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  conditionDescription: string;
}

export interface PlayerStats {
  totalGames: Record<GameMode, number>;
  bestScore: Record<GameMode, number>;
  bestTime: Record<GameMode, number | undefined>;
  totalSequencesCompleted: number;
  lastSessions: GameSession[];
}

export interface EchoMarker {
  mode: GameMode;
  sequenceLength: number;
  timestamp: number;
}

export interface PadPosition {
  padIndex: number; // 0, 1, 2, 3
  slotIndex: number; // 0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right
}
