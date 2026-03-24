export enum CellType {
  SAFE = 'safe',
  MINE_SAFE = 'mine_safe',
  MINE_DANGER = 'mine_danger',
}

export interface Cell {
  type: CellType;
  adjacentMines: number;
}
