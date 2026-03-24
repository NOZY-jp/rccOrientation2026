import { describe, expect, it } from 'vitest';
import type { Checkpoint } from '../../../core/types/index.ts';
import { collectCheckpoints } from '../checkpoint-service.ts';

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

describe('collectCheckpoints', () => {
  it('同一セル上に未回収CPがある場合、回収されること', () => {
    const checkpoints = [createCheckpoint('cp-0', 2, 3)];

    const result = collectCheckpoints(2.9, 3.1, checkpoints);

    expect(result.collected.map((cp) => cp.id)).toEqual(['cp-0']);
    expect(checkpoints[0]?.collected).toBe(true);
  });

  it('既に回収済みの場合、再度回収されないこと', () => {
    const checkpoints = [createCheckpoint('cp-0', 2, 3, { collected: true })];

    const result = collectCheckpoints(2.2, 3.8, checkpoints);

    expect(result.collected).toEqual([]);
    expect(checkpoints[0]?.collected).toBe(true);
  });

  it('同一セル上に複数の未回収CPがある場合、すべて回収されること', () => {
    const checkpoints = [
      createCheckpoint('cp-0', 1, 1),
      createCheckpoint('cp-1', 1, 1),
      createCheckpoint('cp-2', 2, 2),
    ];

    const result = collectCheckpoints(1.4, 1.6, checkpoints);

    expect(result.collected.map((cp) => cp.id)).toEqual(['cp-0', 'cp-1']);
    expect(checkpoints[0]?.collected).toBe(true);
    expect(checkpoints[1]?.collected).toBe(true);
    expect(checkpoints[2]?.collected).toBe(false);
  });

  it('全CPが回収済みの場合、allCollectedがtrueになること', () => {
    const checkpoints = [
      createCheckpoint('cp-0', 1, 1, { collected: true }),
      createCheckpoint('cp-1', 2, 2),
    ];

    const result = collectCheckpoints(2.1, 2.2, checkpoints);

    expect(result.collected.map((cp) => cp.id)).toEqual(['cp-1']);
    expect(result.allCollected).toBe(true);
  });

  it('未回収CPが残っている場合、allCollectedがfalseになること', () => {
    const checkpoints = [
      createCheckpoint('cp-0', 1, 1),
      createCheckpoint('cp-1', 2, 2),
    ];

    const result = collectCheckpoints(1.0, 1.0, checkpoints);

    expect(result.collected.map((cp) => cp.id)).toEqual(['cp-0']);
    expect(result.allCollected).toBe(false);
  });
});
