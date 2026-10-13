import Dexie, { Table } from 'dexie';
import { GameMode, GameRecord, GameSession, UnlockItem, PlayerStats, PaletteThemeId, SoundThemeId } from '../types';

export class EcoDB extends Dexie {
  records!: Table<GameRecord, number>;
  sessions!: Table<GameSession, number>;
  unlocks!: Table<UnlockItem, string>;

  constructor() {
    super('eco_db');
    this.version(1).stores({
      records: '++id, mode, score, date',
      sessions: '++id, mode, date',
      unlocks: 'id, type, unlockedAt'
    });
  }
}

export const db = new EcoDB();

const DEFAULT_UNLOCKS: UnlockItem[] = [
  {
    id: 'theme_neon',
    type: 'palette',
    name: 'Neon Arcade',
    description: 'Paleta eletromagnética vibrante de arcade retrofuturista.',
    conditionDescription: 'Jogar 10 partidas no modo Clássico',
    unlocked: false
  },
  {
    id: 'theme_mono',
    type: 'palette',
    name: 'Monochrome',
    description: 'Estética minimalista brutalista em gradiente de fósforo puro.',
    conditionDescription: 'Alcançar sequência 10 no modo Clássico',
    unlocked: false
  },
  {
    id: 'sound_crystal',
    type: 'sound',
    name: 'Crystal Sound',
    description: 'Ondas sinusoidais puras com harmônicos etéreos de cristal.',
    conditionDescription: 'Jogar 5 partidas no modo Zen',
    unlocked: false
  },
  {
    id: 'theme_space',
    type: 'palette',
    name: 'Deep Space',
    description: 'Tons de nebulosa cósmica, silêncio e radiação estelar.',
    conditionDescription: 'Alcançar sequência 12 no Tabuleiro Vivo',
    unlocked: false
  },
  {
    id: 'sound_retro',
    type: 'sound',
    name: 'Retro 8-Bit',
    description: 'Onda quadrada vintage com ataque rápido dos fliperamas clássicos.',
    conditionDescription: 'Jogar ao menos 1 partida em todos os 4 modos',
    unlocked: false
  }
];

export class StorageService {
  private static isDexieAvailable = true;

  public static async init(): Promise<void> {
    try {
      await db.open();
      // Initialize default unlocks if empty
      const count = await db.unlocks.count();
      if (count === 0) {
        await db.unlocks.bulkPut(DEFAULT_UNLOCKS);
      }
    } catch {
      this.isDexieAvailable = false;
      this.initLocalStorageDefaults();
    }
  }

  private static initLocalStorageDefaults(): void {
    if (!localStorage.getItem('eco_unlocks')) {
      localStorage.setItem('eco_unlocks', JSON.stringify(DEFAULT_UNLOCKS));
    }
    if (!localStorage.getItem('eco_records')) {
      localStorage.setItem('eco_records', JSON.stringify([]));
    }
    if (!localStorage.getItem('eco_sessions')) {
      localStorage.setItem('eco_sessions', JSON.stringify([]));
    }
  }

  public static async saveRecord(record: GameRecord): Promise<void> {
    try {
      if (this.isDexieAvailable) {
        await db.records.add(record);
      } else {
        const records = this.getLocalStorageRecords();
        records.push({ ...record, id: Date.now() });
        localStorage.setItem('eco_records', JSON.stringify(records));
      }
    } catch {
      // Fallback
    }
  }

  public static async saveSession(session: GameSession): Promise<void> {
    try {
      if (this.isDexieAvailable) {
        await db.sessions.add(session);
      } else {
        const sessions = this.getLocalStorageSessions();
        sessions.push({ ...session, id: Date.now() });
        localStorage.setItem('eco_sessions', JSON.stringify(sessions));
      }
    } catch {
      // Fallback
    }
  }

  public static async getTopRecords(mode: GameMode, limit = 5): Promise<GameRecord[]> {
    try {
      if (this.isDexieAvailable) {
        return await db.records
          .where('mode')
          .equals(mode)
          .reverse()
          .sortBy('score')
          .then(list => list.slice(0, limit));
      }
    } catch {
      // Fallback to localStorage
    }
    const list = this.getLocalStorageRecords().filter(r => r.mode === mode);
    return list.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  public static async getBestScore(mode: GameMode): Promise<number> {
    const top = await this.getTopRecords(mode, 1);
    return top.length > 0 ? top[0].score : 0;
  }

  public static async getPlayerStats(): Promise<PlayerStats> {
    const modes: GameMode[] = ['classic', 'liveboard', 'reverse', 'zen'];
    const totalGames: Record<GameMode, number> = { classic: 0, liveboard: 0, reverse: 0, zen: 0 };
    const bestScore: Record<GameMode, number> = { classic: 0, liveboard: 0, reverse: 0, zen: 0 };
    const bestTime: Record<GameMode, number | undefined> = { classic: undefined, liveboard: undefined, reverse: undefined, zen: undefined };

    let allSessions: GameSession[] = [];
    let totalSequencesCompleted = 0;

    try {
      if (this.isDexieAvailable) {
        allSessions = await db.sessions.orderBy('date').reverse().limit(30).toArray();
        const allDbSessions = await db.sessions.toArray();
        totalSequencesCompleted = allDbSessions.reduce((acc, s) => acc + (s.score || 0), 0);

        for (const m of modes) {
          totalGames[m] = await db.sessions.where('mode').equals(m).count();
          const top = await db.records.where('mode').equals(m).reverse().sortBy('score');
          bestScore[m] = top.length > 0 ? top[0].score : 0;
          if (top.length > 0 && top[0].timeMs) {
            bestTime[m] = top[0].timeMs;
          }
        }
      } else {
        const storedSessions = this.getLocalStorageSessions();
        allSessions = storedSessions.slice().reverse().slice(0, 30);
        totalSequencesCompleted = storedSessions.reduce((acc, s) => acc + (s.score || 0), 0);

        for (const m of modes) {
          const modeSessions = storedSessions.filter(s => s.mode === m);
          totalGames[m] = modeSessions.length;
          const top = this.getLocalStorageRecords().filter(r => r.mode === m).sort((a, b) => b.score - a.score);
          bestScore[m] = top.length > 0 ? top[0].score : 0;
          if (top.length > 0 && top[0].timeMs) {
            bestTime[m] = top[0].timeMs;
          }
        }
      }
    } catch {
      // Fallback
    }

    return {
      totalGames,
      bestScore,
      bestTime,
      totalSequencesCompleted,
      lastSessions: allSessions
    };
  }

  public static async getUnlocks(): Promise<UnlockItem[]> {
    try {
      if (this.isDexieAvailable) {
        return await db.unlocks.toArray();
      }
    } catch {
      // Fallback
    }
    const raw = localStorage.getItem('eco_unlocks');
    return raw ? JSON.parse(raw) : DEFAULT_UNLOCKS;
  }

  public static async checkAndGrantUnlocks(stats: PlayerStats): Promise<UnlockItem[]> {
    const unlocks = await this.getUnlocks();
    const newlyUnlocked: UnlockItem[] = [];

    for (const item of unlocks) {
      if (item.unlocked) continue;
      let shouldUnlock = false;

      if (item.id === 'theme_neon' && stats.totalGames['classic'] >= 10) shouldUnlock = true;
      if (item.id === 'theme_mono' && stats.bestScore['classic'] >= 10) shouldUnlock = true;
      if (item.id === 'sound_crystal' && stats.totalGames['zen'] >= 5) shouldUnlock = true;
      if (item.id === 'theme_space' && stats.bestScore['liveboard'] >= 12) shouldUnlock = true;
      if (
        item.id === 'sound_retro' &&
        stats.totalGames['classic'] > 0 &&
        stats.totalGames['liveboard'] > 0 &&
        stats.totalGames['reverse'] > 0 &&
        stats.totalGames['zen'] > 0
      ) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        item.unlocked = true;
        item.unlockedAt = Date.now();
        newlyUnlocked.push(item);
        if (this.isDexieAvailable) {
          await db.unlocks.put(item);
        }
      }
    }

    if (!this.isDexieAvailable) {
      localStorage.setItem('eco_unlocks', JSON.stringify(unlocks));
    }

    return newlyUnlocked;
  }

  // Preferences (Saved Palette & Sound)
  public static getSavedPalette(): PaletteThemeId {
    return (localStorage.getItem('eco_pref_palette') as PaletteThemeId) || 'default';
  }

  public static setSavedPalette(id: PaletteThemeId): void {
    localStorage.setItem('eco_pref_palette', id);
  }

  public static getSavedSound(): SoundThemeId {
    return (localStorage.getItem('eco_pref_sound') as SoundThemeId) || 'default';
  }

  public static setSavedSound(id: SoundThemeId): void {
    localStorage.setItem('eco_pref_sound', id);
  }

  public static getHapticsEnabled(): boolean {
    const val = localStorage.getItem('eco_pref_haptics');
    return val === null ? true : val === 'true';
  }

  public static setHapticsEnabled(enabled: boolean): void {
    localStorage.setItem('eco_pref_haptics', String(enabled));
  }

  // LocalStorage Helpers
  private static getLocalStorageRecords(): GameRecord[] {
    const raw = localStorage.getItem('eco_records');
    return raw ? JSON.parse(raw) : [];
  }

  private static getLocalStorageSessions(): GameSession[] {
    const raw = localStorage.getItem('eco_sessions');
    return raw ? JSON.parse(raw) : [];
  }
}
