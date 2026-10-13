import { GameMode } from '../types';

export class SequenceEngine {
  private currentSequence: number[] = [];
  private playerInputIndex = 0;
  private lastGeneratedSequence: number[] = [];

  public reset(startLength = 1): number[] {
    this.currentSequence = [];
    this.playerInputIndex = 0;

    for (let i = 0; i < startLength; i++) {
      this.currentSequence.push(this.getRandomPad());
    }

    // Ensure we don't repeat the exact previous sequence if possible
    if (
      this.lastGeneratedSequence.length === this.currentSequence.length &&
      this.currentSequence.every((val, idx) => val === this.lastGeneratedSequence[idx])
    ) {
      this.currentSequence[this.currentSequence.length - 1] = (this.currentSequence[this.currentSequence.length - 1] + 1) % 4;
    }

    this.lastGeneratedSequence = [...this.currentSequence];
    return [...this.currentSequence];
  }

  public addStep(): number[] {
    this.currentSequence.push(this.getRandomPad());
    this.playerInputIndex = 0;
    return [...this.currentSequence];
  }

  public getSequence(): number[] {
    return [...this.currentSequence];
  }

  public getSequenceLength(): number {
    return this.currentSequence.length;
  }

  public resetInputIndex(): void {
    this.playerInputIndex = 0;
  }

  public getCurrentInputIndex(): number {
    return this.playerInputIndex;
  }

  public getTargetForCurrentInput(mode: GameMode): number {
    if (mode === 'reverse') {
      // In reverse mode, target is from back to front: sequence[length - 1 - index]
      const targetIndex = this.currentSequence.length - 1 - this.playerInputIndex;
      return this.currentSequence[targetIndex];
    }
    return this.currentSequence[this.playerInputIndex];
  }

  /**
   * Validates player input against sequence for current mode.
   * Returns: { valid: boolean, isSequenceComplete: boolean, expectedPad: number }
   */
  public validateInput(padIndex: number, mode: GameMode): { valid: boolean; isSequenceComplete: boolean; expectedPad: number } {
    const expectedPad = this.getTargetForCurrentInput(mode);
    const valid = padIndex === expectedPad;

    if (!valid) {
      return { valid: false, isSequenceComplete: false, expectedPad };
    }

    this.playerInputIndex++;
    const isSequenceComplete = this.playerInputIndex >= this.currentSequence.length;

    return {
      valid: true,
      isSequenceComplete,
      expectedPad
    };
  }

  private getRandomPad(): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % 4;
  }
}
