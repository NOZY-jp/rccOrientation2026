import { describe, expect, it } from 'vitest';
import { CellType, type Cell } from '../../../core/types/cell.ts';
import { getFrontlineCandidates, selectErosionTargets } from '../erosion-frontline.ts';

function createCells(layout: CellType[][]): Cell[][] {
  return layout.map((row) => row.map((type) => ({ type, adjacentMines: 0 })));
}

function keyOf(position: { x: number; y: number }): string {
  return `${position.x},${position.y}`;
}

describe('前線探索', () => {
  it('地雷原に隣接する安全セルが正しくfrontlineとして特定されること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    const frontline = getFrontlineCandidates(cells, 3, 3);

    expect(frontline).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
  });

  it('WASTELANDもfrontline候補に含まれること', () => {
    const cells = createCells([
      [CellType.WASTELAND, CellType.MINE_DANGER],
      [CellType.HOLE, CellType.HOLE],
    ]);

    const frontline = getFrontlineCandidates(cells, 2, 2);

    expect(frontline).toEqual([{ x: 0, y: 0 }]);
  });

  it('HOLEはfrontline候補に含まれないこと', () => {
    const cells = createCells([
      [CellType.HOLE, CellType.MINE_SAFE],
      [CellType.SAFE, CellType.HOLE],
    ]);

    const frontline = getFrontlineCandidates(cells, 2, 2);

    expect(frontline).toEqual([{ x: 0, y: 1 }]);
  });

  it('SAFEセル（開拓済み）がfrontline候補に含まれること', () => {
    const cells = createCells([
      [CellType.MINE_DANGER, CellType.SAFE],
      [CellType.HOLE, CellType.HOLE],
    ]);

    const frontline = getFrontlineCandidates(cells, 2, 2);

    expect(frontline).toEqual([{ x: 1, y: 0 }]);
  });

  it('隣接しないセルはfrontlineに含まれないこと', () => {
    const cells = createCells([
      [CellType.MINE_SAFE, CellType.HOLE, CellType.HOLE],
      [CellType.HOLE, CellType.HOLE, CellType.HOLE],
      [CellType.HOLE, CellType.HOLE, CellType.SAFE],
    ]);

    const frontline = getFrontlineCandidates(cells, 3, 3);

    expect(frontline).toEqual([]);
  });
});

describe('侵食対象選択', () => {
  it('侵食力の数だけセルが選択されること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    const targets = selectErosionTargets(cells, 3, 3, 3, new Set());

    expect(targets).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  it('侵食力 > frontline候補数の場合、全候補が選択されること', () => {
    const cells = createCells([
      [CellType.MINE_SAFE, CellType.SAFE],
      [CellType.HOLE, CellType.HOLE],
    ]);

    const targets = selectErosionTargets(cells, 2, 2, 5, new Set());

    expect(targets).toEqual([{ x: 1, y: 0 }]);
  });

  it('frontlineが不足する場合、BFSで隣接セルへ拡張して選択すること', () => {
    const cells = createCells([
      [CellType.MINE_DANGER, CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.HOLE, CellType.HOLE, CellType.HOLE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    const targets = selectErosionTargets(cells, 4, 3, 3, new Set());

    expect(targets).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
  });

  it('同一入力で常に同じ選択順序であること（決定性）', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_DANGER, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    const a = selectErosionTargets(cells, 3, 3, 5, new Set());
    const b = selectErosionTargets(cells, 3, 3, 5, new Set());

    expect(a).toEqual(b);
  });

  it('タイブレークが固定スキャン順序であること（上から下、左から右）', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    const targets = selectErosionTargets(cells, 3, 3, 8, new Set());

    expect(targets).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
  });

  it('既に警告中のセルは再選択されないこと', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    const targets = selectErosionTargets(cells, 3, 3, 4, new Set(['0,0', '1,0']));

    expect(targets).toEqual([
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
    ]);
  });

  it('MINE_SAFE/MINE_DANGERセルが侵食対象として選択されないこと', () => {
    const cells = createCells([
      [CellType.MINE_SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.MINE_DANGER, CellType.HOLE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    const targets = selectErosionTargets(cells, 3, 3, 6, new Set());

    expect(targets.every((target) => {
      const row = cells[target.y];
      const cell = row?.[target.x];
      const type = cell?.type;
      return type !== CellType.MINE_SAFE && type !== CellType.MINE_DANGER;
    })).toBe(true);
  });

  it('複数回の侵食サイクルで候補が減っていくこと', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    const first = selectErosionTargets(cells, 3, 3, 2, new Set());
    const exclude = new Set(first.map(keyOf));
    const second = selectErosionTargets(cells, 3, 3, 2, exclude);

    expect(second.some((cell) => exclude.has(keyOf(cell)))).toBe(false);
  });

  it('frontlineが存在しない場合（地雷がない、または全セルが地雷）は空配列を返すこと', () => {
    const noMines = createCells([
      [CellType.SAFE, CellType.SAFE],
      [CellType.WASTELAND, CellType.SAFE],
    ]);
    const allMines = createCells([
      [CellType.MINE_SAFE, CellType.MINE_DANGER],
      [CellType.MINE_DANGER, CellType.MINE_SAFE],
    ]);

    expect(selectErosionTargets(noMines, 2, 2, 3, new Set())).toEqual([]);
    expect(selectErosionTargets(allMines, 2, 2, 3, new Set())).toEqual([]);
  });
});
