import { describe, expect, it } from 'vitest';
import type { Checkpoint } from '../../../core/types/index.ts';
import { detectCheckpoints } from '../checkpoint-service.ts';

function createCheckpoint(
  id: string,
  x: number,
  y: number,
  options?: { collected?: boolean; detectedBy?: string[] }
): Checkpoint {
  return {
    id,
    x,
    y,
    collected: options?.collected ?? false,
    detectedBy: new Set(options?.detectedBy ?? []),
  };
}

describe('detectCheckpoints', () => {
  it('検知範囲外にある場合、検知されないこと', () => {
    const checkpoints = [createCheckpoint('cp-0', 3, 0)];

    const detected = detectCheckpoints(0.5, 0.5, checkpoints, 'p1', {
      detectionRadius: 1,
    });

    expect(detected).toEqual([]);
    expect(checkpoints[0]?.detectedBy.has('p1')).toBe(false);
  });

  it('検知範囲内の未検知CPがある場合、検知されること', () => {
    const checkpoints = [createCheckpoint('cp-0', 1, 0)];

    const detected = detectCheckpoints(0.6, 0.6, checkpoints, 'p1', {
      detectionRadius: 1,
    });

    expect(detected.map((cp) => cp.id)).toEqual(['cp-0']);
    expect(checkpoints[0]?.detectedBy.has('p1')).toBe(true);
  });

  it('距離が境界値(dist² = R²)の場合、検知されること', () => {
    const checkpoints = [createCheckpoint('cp-0', 1, 0)];

    const detected = detectCheckpoints(0.5, 0.5, checkpoints, 'p1', {
      detectionRadius: 1,
    });

    expect(detected.map((cp) => cp.id)).toEqual(['cp-0']);
    expect(checkpoints[0]?.detectedBy.has('p1')).toBe(true);
  });

  it('プレイヤー座標が浮動小数点の場合、セル中心基準で検知判定されること', () => {
    const checkpoints = [createCheckpoint('cp-0', 1, 2)];

    const detected = detectCheckpoints(1.2, 2.7, checkpoints, 'p1', {
      detectionRadius: 0.5,
    });

    expect(detected.map((cp) => cp.id)).toEqual(['cp-0']);
  });

  it('既に同一プレイヤーが検知済みの場合、再検知されないこと', () => {
    const checkpoints = [createCheckpoint('cp-0', 1, 0, { detectedBy: ['p1'] })];

    const detected = detectCheckpoints(0.5, 0.5, checkpoints, 'p1', {
      detectionRadius: 1,
    });

    expect(detected).toEqual([]);
    expect(checkpoints[0]?.detectedBy.size).toBe(1);
  });
});
