import { describe, expect, it } from 'vitest';
import { DEFAULT_EROSION_CONFIG } from '../erosion-types.ts';

describe('侵食設定', () => {
  it('デフォルト設定値が正しい', () => {
    expect(DEFAULT_EROSION_CONFIG).toEqual({
      interval: 15000,
      power: 3,
      warningTime: 3000,
      dangerRatio: 0.3,
      wastelandDangerRatio: 1.0,
    });
  });

  it('デフォルト設定が境界条件を満たす', () => {
    expect(DEFAULT_EROSION_CONFIG.interval).toBeGreaterThan(0);
    expect(DEFAULT_EROSION_CONFIG.power).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_EROSION_CONFIG.warningTime).toBeGreaterThan(0);
    expect(DEFAULT_EROSION_CONFIG.dangerRatio).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_EROSION_CONFIG.dangerRatio).toBeLessThanOrEqual(1);
    expect(DEFAULT_EROSION_CONFIG.wastelandDangerRatio).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_EROSION_CONFIG.wastelandDangerRatio).toBeLessThanOrEqual(1);
  });
});
