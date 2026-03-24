import type { Cell } from './cell.ts';
import type { Checkpoint } from './checkpoint.ts';
import type { Player } from './player.ts';

export enum GamePhase {
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  FLOOR_CLEAR = 'FLOOR_CLEAR',
}

export interface GameState {
  width: number;
  height: number;
  cells: Cell[][];
  players: Map<string, Player>;
  phase: GamePhase;
  mines: Set<string>;
  flags: Set<string>;
  checkpoints?: Checkpoint[];
  floorNumber?: number;
  collectedCheckpoints?: number;
}

export interface BoardConfig {
  width: number;
  height: number;
  mineCount: number;
  seed: number;
}
