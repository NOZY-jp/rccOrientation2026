import { CellType, type GameState } from '../types/index.ts';

export function toggleFlag(state: GameState, x: number, y: number): boolean {
  const row = state.cells[y];
  if (row === undefined) {
    return false;
  }

  const cell = row[x];
  if (cell === undefined) {
    return false;
  }

  if (cell.type === CellType.SAFE) {
    return false;
  }

  if (cell.type !== CellType.MINE_SAFE && cell.type !== CellType.MINE_DANGER) {
    return false;
  }

  const key = `${x},${y}`;

  if (state.flags.has(key)) {
    state.flags.delete(key);
    return false;
  }

  state.flags.add(key);
  return true;
}
