import { describe, expect, it } from 'vitest';
import { CellType, type Cell } from '../../../core/types/cell.ts';
import { recalculateNumbers } from '../number-recalculation.ts';

function createCells(layout: CellType[][]): Cell[][] {
  return layout.map((row) => row.map((type) => ({ type, adjacentMines: 0 })));
}

function setAdjacents(cells: Cell[][], values: number[][]): void {
  for (let y = 0; y < values.length; y += 1) {
    const row = values[y];
    if (!row) {
      continue;
    }
    for (let x = 0; x < row.length; x += 1) {
      const cell = cells[y]?.[x];
      const value = row[x];
      if (cell !== undefined && value !== undefined) {
        cell.adjacentMines = value;
      }
    }
  }
}

function setCellType(cells: Cell[][], x: number, y: number, type: CellType): void {
  const cell = cells[y]?.[x];
  if (!cell) {
    throw new Error(`Cell not found at ${x},${y}`);
  }
  cell.type = type;
}

describe('数字再計算', () => {
  it('侵食後の対象セルのadjacentMinesが正しく再計算されること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.MINE_DANGER, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    recalculateNumbers(cells, 1, 1, 3, 3);

    expect(cells[1]?.[1]?.adjacentMines).toBe(1);
  });

  it('隣接セルのadjacentMinesも正しく再計算されること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.MINE_DANGER, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    recalculateNumbers(cells, 1, 1, 3, 3);

    expect(cells[0]?.[0]?.adjacentMines).toBe(1);
    expect(cells[0]?.[2]?.adjacentMines).toBe(1);
    expect(cells[1]?.[0]?.adjacentMines).toBe(1);
    expect(cells[1]?.[2]?.adjacentMines).toBe(1);
    expect(cells[2]?.[0]?.adjacentMines).toBe(0);
    expect(cells[2]?.[1]?.adjacentMines).toBe(0);
    expect(cells[2]?.[2]?.adjacentMines).toBe(0);
  });

  it('境界外のセルは無視されること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.MINE_DANGER],
      [CellType.SAFE, CellType.SAFE],
    ]);

    expect(() => recalculateNumbers(cells, 0, 0, 2, 2)).not.toThrow();
    expect(cells[0]?.[0]?.adjacentMines).toBe(1);
    expect(cells[1]?.[0]?.adjacentMines).toBe(1);
    expect(cells[1]?.[1]?.adjacentMines).toBe(1);
  });

  it('複数セルが同時に変換された場合も正しく再計算されること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.MINE_DANGER, CellType.SAFE],
      [CellType.MINE_DANGER, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    recalculateNumbers(cells, 1, 1, 3, 3);

    expect(cells[1]?.[1]?.adjacentMines).toBe(2);
    expect(cells[0]?.[0]?.adjacentMines).toBe(2);
    expect(cells[2]?.[2]?.adjacentMines).toBe(0);
  });

  it('数字が増加したセルと減少したセルの両方が正しく処理されること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.MINE_DANGER, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    setAdjacents(cells, [
      [1, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ]);

    setCellType(cells, 0, 1, CellType.SAFE);
    setCellType(cells, 1, 0, CellType.MINE_DANGER);

    recalculateNumbers(cells, 1, 1, 3, 3);

    expect(cells[1]?.[1]?.adjacentMines).toBe(1);
    expect(cells[0]?.[2]?.adjacentMines).toBe(1);
    expect(cells[2]?.[0]?.adjacentMines).toBe(0);
  });

  it('MINE_DANGERの追加で隣接セルの数字が増えること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);

    recalculateNumbers(cells, 1, 1, 3, 3);
    expect(cells[1]?.[1]?.adjacentMines).toBe(0);

    setCellType(cells, 1, 0, CellType.MINE_DANGER);
    recalculateNumbers(cells, 1, 1, 3, 3);

    expect(cells[1]?.[1]?.adjacentMines).toBe(1);
    expect(cells[0]?.[0]?.adjacentMines).toBe(1);
  });
});
