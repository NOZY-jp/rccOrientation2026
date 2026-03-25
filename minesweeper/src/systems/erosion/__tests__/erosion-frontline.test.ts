import { describe, expect, it } from 'vitest';
import { CellType, type Cell } from '../../../core/types/cell.ts';
import {
  getFrontlineCandidates,
  selectErosionTargets,
} from '../erosion-frontline.ts';

function createCells(width: number, height: number, defaultType: CellType = CellType.SAFE): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: defaultType,
      adjacentMines: 0,
    }))
  );
}

function setCell(cells: Cell[][], x: number, y: number, type: CellType, adjacentMines = 0): void {
  const row = cells[y];
  if (row === undefined) {
    throw new Error('行が存在しません');
  }

  const cell = row[x];
  if (cell === undefined) {
    throw new Error('セルが存在しません');
  }

  cell.type = type;
  cell.adjacentMines = adjacentMines;
}

describe('getFrontlineCandidates', () => {
  it('地雷原に隣接するSAFEセルが前線候補として抽出されること', () => {
    const cells = createCells(3, 3, CellType.SAFE);
    setCell(cells, 1, 1, CellType.MINE_SAFE);

    const result = getFrontlineCandidates(cells, 3, 3, new Set<string>());

    expect(result).toEqual([
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

  it('地雷原に隣接するWASTELANDセルが前線候補として抽出されること', () => {
    const cells = createCells(2, 2, CellType.SAFE);
    setCell(cells, 0, 0, CellType.MINE_DANGER);
    setCell(cells, 1, 0, CellType.WASTELAND);

    const result = getFrontlineCandidates(cells, 2, 2, new Set<string>());

    expect(result).toContainEqual({ x: 1, y: 0 });
  });

  it('HOLEセルは地雷原に隣接していても前線候補にならないこと', () => {
    const cells = createCells(2, 2, CellType.SAFE);
    setCell(cells, 0, 0, CellType.MINE_DANGER);
    setCell(cells, 1, 0, CellType.HOLE);

    const result = getFrontlineCandidates(cells, 2, 2, new Set<string>());

    expect(result).not.toContainEqual({ x: 1, y: 0 });
  });

  it('adjacentMinesが1以上のSAFEセルも地雷原隣接なら前線候補になること', () => {
    const cells = createCells(2, 2, CellType.SAFE);
    setCell(cells, 0, 0, CellType.MINE_SAFE);
    setCell(cells, 1, 1, CellType.SAFE, 2);

    const result = getFrontlineCandidates(cells, 2, 2, new Set<string>());

    expect(result).toContainEqual({ x: 1, y: 1 });
  });

  it('地雷原に隣接していないセルは前線候補にならないこと', () => {
    const cells = createCells(3, 3, CellType.SAFE);
    setCell(cells, 0, 0, CellType.MINE_SAFE);

    const result = getFrontlineCandidates(cells, 3, 3, new Set<string>());

    expect(result).not.toContainEqual({ x: 2, y: 2 });
  });

  it('既存warningセルは前線候補から除外されること', () => {
    const cells = createCells(2, 2, CellType.SAFE);
    setCell(cells, 0, 0, CellType.MINE_SAFE);

    const result = getFrontlineCandidates(cells, 2, 2, new Set<string>(['1,0']));

    expect(result).not.toContainEqual({ x: 1, y: 0 });
  });

  it('候補の並び順は行優先(y昇順→x昇順)で決定的であること', () => {
    const cells = createCells(3, 3, CellType.HOLE);
    setCell(cells, 1, 1, CellType.MINE_DANGER);
    setCell(cells, 2, 0, CellType.SAFE);
    setCell(cells, 0, 1, CellType.SAFE);
    setCell(cells, 1, 2, CellType.WASTELAND);

    const result = getFrontlineCandidates(cells, 3, 3, new Set<string>());

    expect(result).toEqual([
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 2 },
    ]);
  });
});

describe('selectErosionTargets', () => {
  it('候補数が十分な場合はpower個だけ先頭から選択されること', () => {
    const cells = createCells(3, 3, CellType.SAFE);
    setCell(cells, 1, 1, CellType.MINE_SAFE);

    const result = selectErosionTargets(cells, 3, 3, 3, new Set<string>());

    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  it('powerが候補数より大きい場合は全候補が選択されること', () => {
    const cells = createCells(2, 2, CellType.SAFE);
    setCell(cells, 0, 0, CellType.MINE_DANGER);

    const result = selectErosionTargets(cells, 2, 2, 10, new Set<string>());

    expect(result).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });

  it('同じ入力に対して常に同じ結果を返すこと', () => {
    const cells = createCells(3, 3, CellType.SAFE);
    setCell(cells, 1, 1, CellType.MINE_DANGER);

    const first = selectErosionTargets(cells, 3, 3, 4, new Set<string>());
    const second = selectErosionTargets(cells, 3, 3, 4, new Set<string>());

    expect(first).toEqual(second);
  });
});
