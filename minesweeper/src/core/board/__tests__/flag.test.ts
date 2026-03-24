import { describe, expect, it } from 'vitest';
import { CellType, type GameState } from '../../types/index.ts';
import { toggleFlag } from '../flag.ts';
import { generateBoard } from '../generate-board.ts';

function createState(): GameState {
  return generateBoard({ width: 3, height: 3, mineCount: 0, seed: 101 });
}

function setCellType(state: GameState, x: number, y: number, type: CellType): void {
  const row = state.cells[y];
  if (row === undefined) {
    throw new Error(`row not found: ${y}`);
  }

  const cell = row[x];
  if (cell === undefined) {
    throw new Error(`cell not found: ${x},${y}`);
  }

  cell.type = type;
}

function getCellType(state: GameState, x: number, y: number): CellType {
  const row = state.cells[y];
  if (row === undefined) {
    throw new Error(`row not found: ${y}`);
  }

  const cell = row[x];
  if (cell === undefined) {
    throw new Error(`cell not found: ${x},${y}`);
  }

  return cell.type;
}

describe('toggleFlag', () => {
  it('地雷原セルにフラグを設置できること', () => {
    const state = createState();
    setCellType(state, 0, 0, CellType.MINE_SAFE);

    const placed = toggleFlag(state, 0, 0);

    expect(placed).toBe(true);
    expect(state.flags.has('0,0')).toBe(true);
  });

  it('安全セルにフラグを設置できないこと', () => {
    const state = createState();
    setCellType(state, 1, 1, CellType.SAFE);

    const result = toggleFlag(state, 1, 1);

    expect(result).toBe(false);
    expect(state.flags.size).toBe(0);
  });

  it('フラグ済みセルに再度フラグすると解除されること', () => {
    const state = createState();
    setCellType(state, 2, 2, CellType.MINE_DANGER);

    const first = toggleFlag(state, 2, 2);
    const second = toggleFlag(state, 2, 2);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(state.flags.has('2,2')).toBe(false);
  });

  it('開拓済みセルにフラグしても何も変わらないこと', () => {
    const state = createState();
    setCellType(state, 1, 0, CellType.SAFE);
    state.flags.add('2,0');

    const before = new Set(state.flags);
    const result = toggleFlag(state, 1, 0);

    expect(result).toBe(false);
    expect(state.flags).toEqual(before);
  });

  it('盤面外座標にフラグしても何も変わらないこと', () => {
    const state = createState();
    state.flags.add('0,0');

    const before = new Set(state.flags);
    const result = toggleFlag(state, 3, 1);

    expect(result).toBe(false);
    expect(state.flags).toEqual(before);
  });

  it('フラグ設置で開拓判定に影響しないこと', () => {
    const state = createState();
    setCellType(state, 2, 1, CellType.MINE_SAFE);

    const placed = toggleFlag(state, 2, 1);

    expect(placed).toBe(true);
    expect(getCellType(state, 2, 1)).toBe(CellType.MINE_SAFE);
  });
});
