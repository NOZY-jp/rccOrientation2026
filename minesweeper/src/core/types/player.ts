import type { Direction } from './index.ts';

export interface Player {
  id: string;
  name: string;
  position: {
    x: number;
    y: number;
  };
  facing: Direction;
  isAlive: boolean;
}
