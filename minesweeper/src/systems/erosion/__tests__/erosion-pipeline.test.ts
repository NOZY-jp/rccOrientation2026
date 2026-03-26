import { describe, expect, it } from 'vitest';
import { CellType, type Cell } from '../../../core/types/cell.ts';
import { GamePhase, type GameState } from '../../../core/types/game.ts';
import { updateErosion } from '../erosion-pipeline.ts';
import { createErosionState } from '../erosion-scheduler.ts';
import type { ErosionConfig } from '../erosion-types.ts';

function createCells(layout: CellType[][]): Cell[][] {
  return layout.map((row) => row.map((type) => ({ type, adjacentMines: 0 })));
}

function createState(cells: Cell[][], phase: GamePhase = GamePhase.PLAYING): GameState {
  return {
    width: cells[0]?.length ?? 0,
    height: cells.length,
    cells,
    players: new Map(),
    phase,
    mines: new Set<string>(),
    flags: new Set<string>(),
  };
}

function createConfig(overrides?: Partial<ErosionConfig>): ErosionConfig {
  return {
    interval: 10,
    power: 2,
    warningTime: 5,
    dangerRatio: 1,
    wastelandDangerRatio: 1,
    ...overrides,
  };
}

describe('侵食パイプライン統合', () => {
  it('PLAYINGフェーズで侵食インターバル経過時の場合、ターゲット選択→警告追加されること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);
    const state = createState(cells);
    const erosionState = createErosionState(0, createConfig({ power: 2 }));

    const result = updateErosion(state, erosionState, createConfig({ power: 2 }), 10, GamePhase.PLAYING, () => 0);

    expect(result.result).toBeNull();
    expect(result.erosionState.pendingWarnings).toEqual([
      { x: 0, y: 0, warningExpiry: 15 },
      { x: 1, y: 0, warningExpiry: 15 },
    ]);
    expect(result.erosionState.erosionCount).toBe(1);
    expect(result.erosionState.nextErosionTime).toBe(20);
  });

  it('警告時間経過後の場合、セルが変換されること（選択→警告→実行のフルサイクル）', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);
    const config = createConfig({ power: 2, dangerRatio: 1 });
    const initialState = createState(cells);
    const initialErosion = createErosionState(0, config);

    const warned = updateErosion(initialState, initialErosion, config, 10, GamePhase.PLAYING, () => 0);
    const executed = updateErosion(warned.state, warned.erosionState, config, 16, GamePhase.PLAYING, () => 0);

    expect(executed.result?.converted).toHaveLength(2);
    expect(executed.state.cells[0]?.[0]?.type).toBe(CellType.MINE_DANGER);
    expect(executed.state.cells[0]?.[1]?.type).toBe(CellType.MINE_DANGER);
    expect(executed.state.cells[1]?.[0]?.adjacentMines).toBe(2);
    expect(executed.erosionState.pendingWarnings).toEqual([]);
  });

  it('複数回の侵食サイクルが連続して動作する場合、段階的にセル変換が進むこと', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);
    const config = createConfig({ power: 1, dangerRatio: 0, warningTime: 5, interval: 10 });

    let gameState = createState(cells);
    let erosionState = createErosionState(0, config);

    ({ state: gameState, erosionState } = updateErosion(gameState, erosionState, config, 10, GamePhase.PLAYING, () => 0.99));
    ({ state: gameState, erosionState } = updateErosion(gameState, erosionState, config, 16, GamePhase.PLAYING, () => 0.99));
    ({ state: gameState, erosionState } = updateErosion(gameState, erosionState, config, 20, GamePhase.PLAYING, () => 0.99));
    ({ state: gameState, erosionState } = updateErosion(gameState, erosionState, config, 26, GamePhase.PLAYING, () => 0.99));

    const mineSafeCount = gameState.cells.flat().filter((cell) => cell.type === CellType.MINE_SAFE).length;
    expect(mineSafeCount).toBeGreaterThanOrEqual(3);
    expect(erosionState.erosionCount).toBe(2);
  });

  it('警告時間中の場合、セルが変換されないこと', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);
    const config = createConfig({ power: 2, warningTime: 5, dangerRatio: 1 });
    const initialState = createState(cells);
    const initialErosion = createErosionState(0, config);

    const warned = updateErosion(initialState, initialErosion, config, 10, GamePhase.PLAYING, () => 0);
    const notYet = updateErosion(warned.state, warned.erosionState, config, 13, GamePhase.PLAYING, () => 0);

    expect(notYet.result).toBeNull();
    expect(notYet.state.cells[0]?.[0]?.type).toBe(CellType.SAFE);
    expect(notYet.state.cells[0]?.[1]?.type).toBe(CellType.SAFE);
    expect(notYet.erosionState.pendingWarnings).toHaveLength(2);
  });

  it('FLOOR_CLEARフェーズの場合、侵食が停止すること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);
    const config = createConfig({ interval: 10, power: 2 });
    const state = createState(cells);
    const erosionState = createErosionState(0, config);

    const result = updateErosion(state, erosionState, config, 10, GamePhase.FLOOR_CLEAR, () => 0);

    expect(result.result).toBeNull();
    expect(result.erosionState.pendingWarnings).toEqual([]);
    expect(result.erosionState.erosionCount).toBe(0);
  });

  it('GAME_OVERフェーズの場合、侵食が停止すること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);
    const config = createConfig({ interval: 10, power: 2 });
    const state = createState(cells);
    const erosionState = createErosionState(0, config);

    const result = updateErosion(state, erosionState, config, 10, GamePhase.GAME_OVER, () => 0);

    expect(result.result).toBeNull();
    expect(result.erosionState).toEqual(erosionState);
    expect(result.state.cells).toEqual(state.cells);
  });

  it('フロアクリア時の場合、保留中の警告がキャンセルされること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);
    const config = createConfig({ power: 2, warningTime: 5 });
    const initialState = createState(cells);
    const initialErosion = createErosionState(0, config);

    const warned = updateErosion(initialState, initialErosion, config, 10, GamePhase.PLAYING, () => 0);
    const cancelled = updateErosion(warned.state, warned.erosionState, config, 12, GamePhase.FLOOR_CLEAR, () => 0);

    expect(cancelled.result).toBeNull();
    expect(cancelled.erosionState.active).toBe(false);
    expect(cancelled.erosionState.pendingWarnings).toEqual([]);
    expect(cancelled.state.cells[0]?.[0]?.type).toBe(CellType.SAFE);
  });

  it('複数サイクル進行の場合、累計侵食回数が正しくカウントされること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.MINE_SAFE, CellType.SAFE],
      [CellType.SAFE, CellType.SAFE, CellType.SAFE],
    ]);
    const config = createConfig({ power: 1, interval: 10, warningTime: 1, dangerRatio: 0 });

    let gameState = createState(cells);
    let erosionState = createErosionState(0, config);

    ({ state: gameState, erosionState } = updateErosion(gameState, erosionState, config, 10, GamePhase.PLAYING, () => 0.99));
    ({ state: gameState, erosionState } = updateErosion(gameState, erosionState, config, 11, GamePhase.PLAYING, () => 0.99));
    ({ state: gameState, erosionState } = updateErosion(gameState, erosionState, config, 20, GamePhase.PLAYING, () => 0.99));
    ({ state: gameState, erosionState } = updateErosion(gameState, erosionState, config, 21, GamePhase.PLAYING, () => 0.99));
    ({ erosionState } = updateErosion(gameState, erosionState, config, 30, GamePhase.PLAYING, () => 0.99));

    expect(erosionState.erosionCount).toBe(3);
  });
});
