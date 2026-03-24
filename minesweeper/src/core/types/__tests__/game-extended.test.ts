import { describe, expect, it } from 'vitest';
import {
  type Cell,
  CellType,
  GamePhase,
  type GameState,
  type Player,
} from '../index.ts';

describe('GameState拡張', () => {
  it('チェックポイント情報を含めて生成した場合、拡張フィールドを保持できること', () => {
    const cells: Cell[][] = [
      [
        {
          type: CellType.SAFE,
          adjacentMines: 0,
        },
      ],
    ];

    const players = new Map<string, Player>();
    players.set('p1', {
      id: 'p1',
      name: 'player-1',
      position: { x: 0.5, y: 0.5 },
      facing: 'n',
      isAlive: true,
    });

    const state: GameState = {
      width: 1,
      height: 1,
      cells,
      players,
      phase: GamePhase.PLAYING,
      mines: new Set<string>(),
      flags: new Set<string>(),
      checkpoints: [
        {
          id: 'cp-0',
          x: 0,
          y: 0,
          collected: false,
          detectedBy: new Set<string>(['p1']),
        },
      ],
      floorNumber: 1,
      collectedCheckpoints: 0,
    };

    expect(state.checkpoints).toHaveLength(1);
    expect(state.checkpoints?.[0]?.id).toBe('cp-0');
    expect(state.checkpoints?.[0]?.detectedBy.has('p1')).toBe(true);
    expect(state.floorNumber).toBe(1);
    expect(state.collectedCheckpoints).toBe(0);
  });

  it('既存フィールドのみで生成した場合、後方互換として成立すること', () => {
    const cells: Cell[][] = [
      [
        {
          type: CellType.MINE_SAFE,
          adjacentMines: 0,
        },
      ],
    ];

    const players = new Map<string, Player>();

    const state: GameState = {
      width: 1,
      height: 1,
      cells,
      players,
      phase: GamePhase.PLAYING,
      mines: new Set<string>(),
      flags: new Set<string>(),
    };

    expect(state.width).toBe(1);
    expect(state.checkpoints).toBeUndefined();
    expect(state.floorNumber).toBeUndefined();
    expect(state.collectedCheckpoints).toBeUndefined();
  });
});
