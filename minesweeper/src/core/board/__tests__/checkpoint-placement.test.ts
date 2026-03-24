import { describe, expect, it } from 'vitest';
import { CellType, type Cell } from '../../types/index.ts';
import { placeCheckpoints } from '../place-checkpoints.ts';

function createCells(width: number, height: number): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: CellType.MINE_SAFE,
      adjacentMines: 0,
    }))
  );
}

describe('placeCheckpoints', () => {
  it('候補座標が与えられた場合、候補=trueの座標にCPが配置されること', () => {
    const cells = createCells(4, 3);
    const candidates = [
      [true, false, true, false],
      [false, true, false, false],
      [true, true, false, false],
    ];

    const checkpoints = placeCheckpoints(cells, candidates, 42);
    const actual = new Set(checkpoints.map((cp) => `${cp.x},${cp.y}`));

    expect(actual).toEqual(new Set(['0,0', '2,0', '1,1', '0,2', '1,2']));
  });

  it('候補座標にHOLEセルが含まれる場合、その座標にはCPが配置されないこと', () => {
    const cells = createCells(3, 2);
    const holeCell = cells[0]?.[1];
    if (holeCell === undefined) {
      throw new Error('セルが存在しません');
    }
    holeCell.type = CellType.HOLE;

    const candidates = [
      [true, true, true],
      [false, true, false],
    ];

    const checkpoints = placeCheckpoints(cells, candidates, 100);

    expect(checkpoints.some((cp) => cp.x === 1 && cp.y === 0)).toBe(false);
  });

  it('同一seedの場合、同一の順序とIDでCPが配置されること', () => {
    const cells = createCells(3, 3);
    const candidates = [
      [true, true, false],
      [false, true, false],
      [true, false, true],
    ];

    const first = placeCheckpoints(cells, candidates, 9876);
    const second = placeCheckpoints(cells, candidates, 9876);

    const signature = (items: typeof first) =>
      items.map((cp) => `${cp.id}:${cp.x},${cp.y}`).join('|');

    expect(signature(first)).toBe(signature(second));
    expect(first.map((cp) => cp.id)).toEqual(['cp-0', 'cp-1', 'cp-2', 'cp-3', 'cp-4']);
    for (const cp of first) {
      expect(cp.collected).toBe(false);
      expect(cp.detectedBy).toBeInstanceOf(Set);
      expect(cp.detectedBy.size).toBe(0);
    }
  });
});
