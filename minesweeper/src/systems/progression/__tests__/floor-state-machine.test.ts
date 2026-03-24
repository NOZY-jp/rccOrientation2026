import { describe, expect, it } from 'vitest';
import { generateBoard } from '../../../core/board/generate-board.ts';
import {
  CellType,
  GamePhase,
  type BoardConfig,
  type GameState,
  type Player,
} from '../../../core/types/index.ts';
import { executeFloorClear, generateNextFloor } from '../floor-transition.ts';
import { transitionPhase, type FloorTransitionConfig } from '../floor-state-machine.ts';

function createTransitionConfig(totalFloors = 10): FloorTransitionConfig {
  return {
    floorClearDuration: 1200,
    restDuration: 800,
    totalFloors,
  };
}

function createStateForTransition(floorNumber = 1): GameState {
  return {
    width: 1,
    height: 1,
    cells: [[{ type: CellType.SAFE, adjacentMines: 0 }]],
    players: new Map<string, Player>(),
    phase: GamePhase.PLAYING,
    mines: new Set<string>(),
    flags: new Set<string>(),
    floorNumber,
  };
}

describe('transitionPhase', () => {
  it('cp_all_collected かつ floorNumber が総フロア数未満の場合、FLOOR_CLEARになること', () => {
    const state = createStateForTransition(3);
    const result = transitionPhase(state, 'cp_all_collected', createTransitionConfig(10));
    expect(result).toBe(GamePhase.FLOOR_CLEAR);
  });

  it('cp_all_collected かつ floorNumber が総フロア数以上の場合、VICTORYになること', () => {
    const state = createStateForTransition(10);
    const result = transitionPhase(state, 'cp_all_collected', createTransitionConfig(10));
    expect(result).toBe(GamePhase.VICTORY);
  });

  it('all_dead の場合、GAME_OVERになること', () => {
    const state = createStateForTransition(2);
    const result = transitionPhase(state, 'all_dead', createTransitionConfig(10));
    expect(result).toBe(GamePhase.GAME_OVER);
  });

  it('timer_expired の場合、NEXT_FLOORになること', () => {
    const state = createStateForTransition(2);
    const result = transitionPhase(state, 'timer_expired', createTransitionConfig(10));
    expect(result).toBe(GamePhase.NEXT_FLOOR);
  });

  it('同tickで複数条件が成立しうる場合、呼び出し側でCP全回収を先に判定するとFLOOR_CLEARになること', () => {
    const state = createStateForTransition(2);
    const trigger: 'cp_all_collected' | 'all_dead' = 'cp_all_collected';
    const result = transitionPhase(state, trigger, createTransitionConfig(10));
    expect(result).toBe(GamePhase.FLOOR_CLEAR);
  });
});

describe('executeFloorClear', () => {
  it('フロアクリア処理を実行した場合、地雷原がSAFEに変換されプレイヤー復活とflagsクリアが行われること', () => {
    const state: GameState = {
      width: 2,
      height: 2,
      cells: [
        [
          { type: CellType.MINE_DANGER, adjacentMines: 3 },
          { type: CellType.SAFE, adjacentMines: 1 },
        ],
        [
          { type: CellType.MINE_SAFE, adjacentMines: 2 },
          { type: CellType.SAFE, adjacentMines: 0 },
        ],
      ],
      players: new Map<string, Player>([
        [
          'p1',
          {
            id: 'p1',
            name: 'player-1',
            position: { x: 0.5, y: 0.5 },
            facing: 'n',
            isAlive: false,
          },
        ],
      ]),
      phase: GamePhase.FLOOR_CLEAR,
      mines: new Set<string>(['0,0', '0,1']),
      flags: new Set<string>(['0,0', '1,1']),
      floorNumber: 1,
    };

    executeFloorClear(state);

    expect(state.cells[0]?.[0]?.type).toBe(CellType.SAFE);
    expect(state.cells[1]?.[0]?.type).toBe(CellType.SAFE);
    expect(state.cells[0]?.[0]?.adjacentMines).toBe(0);
    expect(state.cells[1]?.[0]?.adjacentMines).toBe(0);
    expect(state.players.get('p1')?.isAlive).toBe(true);
    expect(state.flags.size).toBe(0);
  });
});

describe('generateNextFloor', () => {
  it('次フロア生成を行う場合、新しい盤面を生成してfloorNumberが1増加すること', () => {
    const config: BoardConfig = {
      width: 5,
      height: 5,
      mineCount: 3,
      seed: 123,
    };
    const state = generateBoard(config);
    state.floorNumber = 1;

    const nextState = generateNextFloor(state, config);

    expect(nextState).not.toBe(state);
    expect(nextState.floorNumber).toBe(2);
    expect(nextState.width).toBe(config.width);
    expect(nextState.height).toBe(config.height);
  });
});
