import { describe, expect, it } from 'vitest';
import {
  type BoardConfig,
  type Cell,
  CellType,
  GamePhase,
  type GameState,
  type Player,
} from '../index.ts';

function createInitialGameState(config: BoardConfig): GameState {
  const cells: Cell[][] = Array.from({ length: config.height }, () =>
    Array.from({ length: config.width }, () => ({
      type: CellType.MINE_SAFE,
      adjacentMines: 0,
    }))
  );

  const players = new Map<string, Player>();
  players.set('p1', {
    id: 'p1',
    name: 'player-1',
    position: { x: 0.5, y: 0.5 },
    facing: 'n',
    isAlive: true,
  });

  const mines = new Set<string>(['1,1', '2,3']);

  return {
    width: config.width,
    height: config.height,
    cells,
    players,
    phase: GamePhase.PLAYING,
    mines,
    flags: new Set<string>(),
  };
}

describe('GameState型定義', () => {
  it('初期GameStateを生成した場合、指定した構造で作成されること', () => {
    const state = createInitialGameState({
      width: 5,
      height: 4,
      mineCount: 2,
      seed: 42,
    });

    expect(state.width).toBe(5);
    expect(state.height).toBe(4);
    expect(state.cells).toHaveLength(4);
    expect(state.cells[0]).toHaveLength(5);
    expect(state.players.has('p1')).toBe(true);
    expect(state.phase).toBe(GamePhase.PLAYING);
  });

  it('地雷座標セットを保持した場合、盤面内の座標のみを表現できること', () => {
    const state = createInitialGameState({
      width: 5,
      height: 4,
      mineCount: 2,
      seed: 7,
    });

    for (const position of state.mines) {
      const [xText = '', yText = ''] = position.split(',');
      const x = Number.parseInt(xText, 10);
      const y = Number.parseInt(yText, 10);

      expect(Number.isNaN(x)).toBe(false);
      expect(Number.isNaN(y)).toBe(false);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(state.width);
      expect(y).toBeLessThan(state.height);
    }
  });
});
