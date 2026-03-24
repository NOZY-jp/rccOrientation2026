export enum CellType {
  SAFE = 'safe',
  MINE_SAFE = 'mine_safe',
  MINE_DANGER = 'mine_danger',
  WASTELAND = 'wasteland',
  HOLE = 'hole',
}

export interface Cell {
  type: CellType;
  adjacentMines: number;
}
