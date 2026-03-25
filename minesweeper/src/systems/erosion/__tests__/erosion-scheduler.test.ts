import { describe, expect, it } from 'vitest';
import { GamePhase } from '../../../core/types/game.ts';
import {
  addWarnings,
  cancelErosion,
  createErosionState,
  updateErosionScheduler,
} from '../erosion-scheduler.ts';
import { DEFAULT_EROSION_CONFIG, type ErosionState } from '../erosion-types.ts';

describe('侵食スケジューラ', () => {
  it('createErosionStateが初期状態を正しく作成する', () => {
    const state = createErosionState(1000, DEFAULT_EROSION_CONFIG);

    expect(state).toEqual({
      active: true,
      nextErosionTime: 16000,
      pendingWarnings: [],
      erosionCount: 0,
    });
  });

  it('phaseがPLAYING以外の場合、warningsToExecuteが空で状態が変化しない', () => {
    const state = createErosionState(1000, DEFAULT_EROSION_CONFIG);
    const result = updateErosionScheduler(state, 20000, GamePhase.FLOOR_CLEAR, DEFAULT_EROSION_CONFIG);

    expect(result.warningsToExecute).toEqual([]);
    expect(result.state).toEqual(state);
  });

  it('warningExpiryを過ぎた警告セルをwarningsToExecuteとして返す', () => {
    const state: ErosionState = {
      active: true,
      nextErosionTime: 40000,
      pendingWarnings: [
        { x: 1, y: 2, warningExpiry: 5000 },
        { x: 3, y: 4, warningExpiry: 8000 },
      ],
      erosionCount: 2,
    };

    const result = updateErosionScheduler(state, 7000, GamePhase.PLAYING, DEFAULT_EROSION_CONFIG);

    expect(result.warningsToExecute).toEqual([{ x: 1, y: 2, warningExpiry: 5000 }]);
    expect(result.state.pendingWarnings).toEqual([{ x: 3, y: 4, warningExpiry: 8000 }]);
    expect(result.state.nextErosionTime).toBe(40000);
    expect(result.state.erosionCount).toBe(2);
  });

  it('インターバル到達時にnextErosionTimeが進みerosionCountが増える', () => {
    const state = createErosionState(1000, DEFAULT_EROSION_CONFIG);
    const result = updateErosionScheduler(state, 16000, GamePhase.PLAYING, DEFAULT_EROSION_CONFIG);

    expect(result.warningsToExecute).toEqual([]);
    expect(result.state.nextErosionTime).toBe(31000);
    expect(result.state.erosionCount).toBe(1);
  });

  it('cancelErosionがpendingWarningsをクリアしactive=falseにする', () => {
    const state: ErosionState = {
      active: true,
      nextErosionTime: 12345,
      pendingWarnings: [{ x: 0, y: 1, warningExpiry: 9999 }],
      erosionCount: 3,
    };

    const result = cancelErosion(state);

    expect(result.active).toBe(false);
    expect(result.pendingWarnings).toEqual([]);
    expect(result.nextErosionTime).toBe(12345);
    expect(result.erosionCount).toBe(3);
  });

  it('addWarningsがwarningExpiryを設定してpendingWarningsに追加する', () => {
    const state = createErosionState(1000, DEFAULT_EROSION_CONFIG);
    const result = addWarnings(
      state,
      [
        { x: 2, y: 3 },
        { x: 4, y: 5 },
      ],
      7000,
      3000,
    );

    expect(result.pendingWarnings).toEqual([
      { x: 2, y: 3, warningExpiry: 10000 },
      { x: 4, y: 5, warningExpiry: 10000 },
    ]);
  });

  it('addWarningsが既存pendingWarningsと重複するターゲットを追加しない', () => {
    const state: ErosionState = {
      active: true,
      nextErosionTime: 20000,
      pendingWarnings: [{ x: 1, y: 1, warningExpiry: 9000 }],
      erosionCount: 1,
    };

    const result = addWarnings(
      state,
      [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
      8000,
      2000,
    );

    expect(result.pendingWarnings).toEqual([
      { x: 1, y: 1, warningExpiry: 9000 },
      { x: 2, y: 2, warningExpiry: 10000 },
    ]);
  });
});
