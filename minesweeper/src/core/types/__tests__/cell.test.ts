import { describe, expect, it } from 'vitest';
import { type Cell, CellType } from '../index.ts';

describe('Cell型定義', () => {
  it('CellTypeの列挙値を参照した場合、期待した文字列値になること', () => {
    expect(CellType.SAFE).toBe('safe');
    expect(CellType.MINE_SAFE).toBe('mine_safe');
    expect(CellType.MINE_DANGER).toBe('mine_danger');
  });

  it('Cell型の値を作成した場合、必須フィールドを保持できること', () => {
    const cell: Cell = {
      type: CellType.SAFE,
      adjacentMines: 2,
    };

    expect(cell.type).toBe(CellType.SAFE);
    expect(cell.adjacentMines).toBe(2);
  });
});
