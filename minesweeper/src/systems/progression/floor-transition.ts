import {
  CellType,
  type BoardConfig,
  type GameState,
} from '../../core/types/index.ts';
import { generateBoard } from '../../core/board/generate-board.ts';

export function executeFloorClear(state: GameState): void {
  for (const row of state.cells) {
    for (const cell of row) {
      if (cell.type === CellType.MINE_DANGER || cell.type === CellType.MINE_SAFE) {
        cell.type = CellType.SAFE;
        cell.adjacentMines = 0;
      }
    }
  }

  for (const player of state.players.values()) {
    player.isAlive = true;
  }

  state.flags.clear();
}

export function generateNextFloor(state: GameState, config: BoardConfig): GameState {
  const nextConfig: BoardConfig = {
    ...config,
    seed: config.seed + (state.floorNumber ?? 1),
  };

  const nextState = generateBoard(nextConfig);
  nextState.floorNumber = (state.floorNumber ?? 1) + 1;
  return nextState;
}
