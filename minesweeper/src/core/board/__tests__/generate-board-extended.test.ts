import { describe, expect, it } from 'vitest';
import { generateBoard } from '../generate-board.ts';

describe('generateBoard (checkpoint extension)', () => {
  it('checkPointCandidatesが指定された場合、GameState.checkpointsにCPが格納されること', () => {
    const candidates = [
      [true, false, true],
      [false, true, false],
      [false, false, false],
    ];

    const state = generateBoard({
      width: 3,
      height: 3,
      mineCount: 0,
      seed: 123,
      checkPointCandidates: candidates,
    });

    expect(state.checkpoints).toBeDefined();
    expect(state.checkpoints?.length).toBe(3);
    expect(new Set(state.checkpoints?.map((cp) => `${cp.x},${cp.y}`))).toEqual(
      new Set(['0,0', '2,0', '1,1'])
    );
  });

  it('checkPointCandidatesが未指定の場合、既存どおりCPなしで動作すること', () => {
    const state = generateBoard({ width: 4, height: 4, mineCount: 3, seed: 55 });

    expect(state.checkpoints).toBeUndefined();
    expect(state.width).toBe(4);
    expect(state.height).toBe(4);
    expect(state.mines.size).toBe(3);
  });

  it('checkPointCandidatesが指定された場合、CPのidがcp-0から連番で付与されること', () => {
    const candidates = [
      [true, true, false],
      [false, false, false],
      [false, false, false],
    ];

    const generated = generateBoard({
      width: 3,
      height: 3,
      mineCount: 0,
      seed: 999,
      checkPointCandidates: candidates,
    });

    expect(generated.checkpoints?.map((cp) => cp.id)).toEqual(['cp-0', 'cp-1']);
  });

  it('同一seedと同一候補の場合、同じCP配置順序になること', () => {
    const candidates = [
      [true, true, true, false],
      [false, true, false, true],
    ];

    const a = generateBoard({
      width: 4,
      height: 2,
      mineCount: 0,
      seed: 2026,
      checkPointCandidates: candidates,
    });
    const b = generateBoard({
      width: 4,
      height: 2,
      mineCount: 0,
      seed: 2026,
      checkPointCandidates: candidates,
    });

    const signature = (items: typeof a.checkpoints) =>
      (items ?? []).map((cp) => `${cp.id}:${cp.x},${cp.y}`).join('|');

    expect(signature(a.checkpoints)).toBe(signature(b.checkpoints));
  });
});
