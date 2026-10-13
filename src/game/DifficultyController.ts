import { GameMode } from '../types';

export class DifficultyController {
  public static getShowInterval(sequenceLength: number, mode: GameMode): number {
    if (mode === 'zen') {
      return 1100;
    }

    if (sequenceLength <= 4) {
      return 780;
    } else if (sequenceLength <= 8) {
      return 620;
    } else if (sequenceLength <= 12) {
      return 480;
    } else {
      return Math.max(300, 360 - (sequenceLength - 13) * 12);
    }
  }

  public static getFlashDuration(sequenceLength: number, mode: GameMode): number {
    const interval = this.getShowInterval(sequenceLength, mode);
    return Math.max(160, Math.floor(interval * 0.65));
  }

  public static getInputTimeout(sequenceLength: number, mode: GameMode): number {
    if (mode === 'zen') {
      return 0; // No timeout in Zen mode
    }

    if (sequenceLength <= 4) {
      return 6000;
    } else if (sequenceLength <= 8) {
      return 5000;
    } else if (sequenceLength <= 12) {
      return 4000;
    } else {
      return 3500;
    }
  }

  public static shouldReshuffle(round: number, mode: GameMode): boolean {
    if (mode !== 'liveboard') return false;

    if (round < 10) {
      return round > 0 && round % 3 === 0;
    } else if (round < 20) {
      return round % 2 === 0;
    } else {
      return true; // Every round at 20+
    }
  }

  public static isReshuffleWarningRound(round: number, mode: GameMode): boolean {
    if (mode !== 'liveboard') return false;
    return this.shouldReshuffle(round + 1, mode);
  }
}
