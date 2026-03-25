import { describe, expect, it } from 'vitest';
import {
  cancelErosion,
  createErosionState,
  getWarnings,
  startErosion,
} from '../erosion-scheduler.ts';
import { DEFAULT_EROSION_CONFIG } from '../erosion-types.ts';

describe('ErosionConfig', () => {
  it('デフォルト設定が要件どおりの値を持つこと', () => {
    expect(DEFAULT_EROSION_CONFIG).toEqual({
      interval: 15000,
      power: 3,
      warningTime: 3000,
      dangerRatio: 0.3,
      wastelandDangerRatio: 1.0,
    });
  });
});

describe('ErosionState', () => {
  it('初期状態を作成した場合、active=false かつ pendingWarnings が空であること', () => {
    const state = createErosionState();

    expect(state).toEqual({
      active: false,
      nextErosionTime: 0,
      pendingWarnings: [],
      erosionCount: 0,
    });
  });

  it('侵食開始した場合、active=true かつ nextErosionTime=currentTime+interval になること', () => {
    const state = createErosionState();

    const started = startErosion(state, 1000, 15000);

    expect(started.active).toBe(true);
    expect(started.nextErosionTime).toBe(16000);
    expect(started.erosionCount).toBe(0);
  });

  it('侵食キャンセルした場合、active=false かつ pendingWarnings がクリアされること', () => {
    const state = {
      active: true,
      nextErosionTime: 20000,
      pendingWarnings: [{ x: 1, y: 2, warningExpiry: 3000 }],
      erosionCount: 1,
    };

    const canceled = cancelErosion(state);

    expect(canceled).toEqual({
      active: false,
      nextErosionTime: 20000,
      pendingWarnings: [],
      erosionCount: 1,
    });
  });

  it('warningExpiry を過ぎていない警告のみ取得されること', () => {
    const state = {
      active: true,
      nextErosionTime: 10000,
      pendingWarnings: [
        { x: 0, y: 0, warningExpiry: 3000 },
        { x: 1, y: 1, warningExpiry: 9000 },
        { x: 2, y: 2, warningExpiry: 12000 },
      ],
      erosionCount: 0,
    };

    const warnings = getWarnings(state, 9000);

    expect(warnings).toEqual([{ x: 2, y: 2, warningExpiry: 12000 }]);
  });
});
