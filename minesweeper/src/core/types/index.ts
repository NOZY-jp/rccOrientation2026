export type Direction8 =
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'nw';

export type Direction4 = 'n' | 'e' | 's' | 'w';

export type Direction = Direction8 | Direction4;

export * from './cell.ts';
export * from './game.ts';
export * from './player.ts';
