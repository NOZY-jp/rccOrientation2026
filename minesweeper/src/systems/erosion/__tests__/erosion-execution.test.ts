import { describe, expect, it } from 'vitest';
import { CellType, type Cell } from '../../../core/types/cell.ts';
import { GamePhase, type GameState } from '../../../core/types/game.ts';
import { executeErosion } from '../erosion-execution.ts';
import type { ErosionConfig, WarningCell } from '../erosion-types.ts';

function createCells(layout: CellType[][]): Cell[][] {
  return layout.map((row) => row.map((type) => ({ type, adjacentMines: 0 })));
}

function createState(cells: Cell[][]): GameState {
  return {
    width: cells[0]?.length ?? 0,
    height: cells.length,
    cells,
    players: new Map(),
    phase: GamePhase.PLAYING,
    mines: new Set<string>(),
    flags: new Set<string>(),
  };
}

function config(overrides?: Partial<ErosionConfig>): ErosionConfig {
  return {
    interval: 15000,
    power: 3,
    warningTime: 3000,
    dangerRatio: 0.3,
    wastelandDangerRatio: 1,
    ...overrides,
  };
}

function target(x: number, y: number): WarningCell {
  return { x, y, warningExpiry: 0 };
}

function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
}

describe('侵食実行', () => {
  it('SAFEセルがMINE_SAFEまたはMINE_DANGERに変換されること', () => {
    const cells = createCells([[CellType.SAFE, CellType.SAFE]]);
    const state = createState(cells);
    const result = executeErosion(
      state,
      [target(0, 0), target(1, 0)],
      config({ dangerRatio: 0.5 }),
      sequenceRandom([0.9, 0.1]),
    );

    expect(state.cells[0]?.[0]?.type).toBe(CellType.MINE_SAFE);
    expect(state.cells[0]?.[1]?.type).toBe(CellType.MINE_DANGER);
    expect(result.converted).toEqual([
      { x: 0, y: 0, oldType: CellType.SAFE, newType: CellType.MINE_SAFE },
      { x: 1, y: 0, oldType: CellType.SAFE, newType: CellType.MINE_DANGER },
    ]);
  });

  it('WASTELANDセルが地雷原に変換されること', () => {
    const cells = createCells([[CellType.WASTELAND]]);
    const state = createState(cells);

    executeErosion(state, [target(0, 0)], config({ wastelandDangerRatio: 0 }), () => 0.5);

    expect(state.cells[0]?.[0]?.type).toBe(CellType.MINE_SAFE);
  });

  it('wastelandDangerRatio=1.0の場合、WASTELANDは常にMINE_DANGERになること', () => {
    const cells = createCells([[CellType.WASTELAND, CellType.WASTELAND]]);
    const state = createState(cells);

    executeErosion(state, [target(0, 0), target(1, 0)], config({ wastelandDangerRatio: 1 }), () => 0.999);

    expect(state.cells[0]?.[0]?.type).toBe(CellType.MINE_DANGER);
    expect(state.cells[0]?.[1]?.type).toBe(CellType.MINE_DANGER);
  });

  it('dangerRatio=0の場合、SAFEは常にMINE_SAFEになること', () => {
    const cells = createCells([[CellType.SAFE]]);
    const state = createState(cells);

    executeErosion(state, [target(0, 0)], config({ dangerRatio: 0 }), () => 0);

    expect(state.cells[0]?.[0]?.type).toBe(CellType.MINE_SAFE);
  });

  it('dangerRatio=1.0の場合、SAFEは常にMINE_DANGERになること', () => {
    const cells = createCells([[CellType.SAFE]]);
    const state = createState(cells);

    executeErosion(state, [target(0, 0)], config({ dangerRatio: 1 }), () => 0.999);

    expect(state.cells[0]?.[0]?.type).toBe(CellType.MINE_DANGER);
  });

  it('変換セル上のフラグが除去されること', () => {
    const cells = createCells([[CellType.SAFE]]);
    const state = createState(cells);
    state.flags.add('0,0');

    const result = executeErosion(state, [target(0, 0)], config(), () => 1);

    expect(state.flags.has('0,0')).toBe(false);
    expect(result.flagsRemoved).toEqual([{ x: 0, y: 0 }]);
  });

  it('変換セル上にフラグがない場合、flagsに変更がないこと', () => {
    const cells = createCells([[CellType.SAFE]]);
    const state = createState(cells);
    state.flags.add('9,9');

    const result = executeErosion(state, [target(0, 0)], config(), () => 1);

    expect(state.flags.has('9,9')).toBe(true);
    expect(result.flagsRemoved).toEqual([]);
  });

  it('HOLEセルは侵食対象に含まれないこと（スキップされる）', () => {
    const cells = createCells([[CellType.HOLE]]);
    const state = createState(cells);

    const result = executeErosion(state, [target(0, 0)], config(), () => 0);

    expect(state.cells[0]?.[0]?.type).toBe(CellType.HOLE);
    expect(result.converted).toEqual([]);
  });

  it('MINE_SAFE/MINE_DANGERセルはスキップされること', () => {
    const cells = createCells([[CellType.MINE_SAFE, CellType.MINE_DANGER]]);
    const state = createState(cells);
    state.mines.add('1,0');

    const result = executeErosion(state, [target(0, 0), target(1, 0)], config(), () => 0);

    expect(state.cells[0]?.[0]?.type).toBe(CellType.MINE_SAFE);
    expect(state.cells[0]?.[1]?.type).toBe(CellType.MINE_DANGER);
    expect(result.converted).toEqual([]);
  });

  it('MINE_DANGERに変換された場合、state.minesに追加されること', () => {
    const cells = createCells([[CellType.SAFE]]);
    const state = createState(cells);

    executeErosion(state, [target(0, 0)], config({ dangerRatio: 1 }), () => 0);

    expect(state.mines.has('0,0')).toBe(true);
  });

  it('MINE_SAFEに変換された場合、state.minesに変更がないこと（既存の地雷は残る）', () => {
    const cells = createCells([[CellType.SAFE]]);
    const state = createState(cells);
    state.mines.add('9,9');

    executeErosion(state, [target(0, 0)], config({ dangerRatio: 0 }), () => 0.5);

    expect(state.mines.has('9,9')).toBe(true);
    expect(state.mines.has('0,0')).toBe(false);
    expect(state.mines.size).toBe(1);
  });

  it('同一random関数で常に同じ変換結果になること（決定性）', () => {
    const first = createState(createCells([[CellType.SAFE, CellType.SAFE, CellType.WASTELAND]]));
    const second = createState(createCells([[CellType.SAFE, CellType.SAFE, CellType.WASTELAND]]));
    const targets = [target(0, 0), target(1, 0), target(2, 0)];

    const resultA = executeErosion(first, targets, config({ dangerRatio: 0.4, wastelandDangerRatio: 0.8 }), sequenceRandom([0.1, 0.7, 0.3]));
    const resultB = executeErosion(second, targets, config({ dangerRatio: 0.4, wastelandDangerRatio: 0.8 }), sequenceRandom([0.1, 0.7, 0.3]));

    expect(resultA.converted).toEqual(resultB.converted);
    expect(first.cells).toEqual(second.cells);
  });

  it('複数ターゲットが同時に処理されること', () => {
    const cells = createCells([
      [CellType.SAFE, CellType.WASTELAND],
      [CellType.SAFE, CellType.SAFE],
    ]);
    const state = createState(cells);

    const result = executeErosion(
      state,
      [target(0, 0), target(1, 0), target(0, 1), target(1, 1)],
      config({ dangerRatio: 0, wastelandDangerRatio: 1 }),
      () => 0.5,
    );

    expect(result.converted).toHaveLength(4);
    expect(state.cells[0]?.[0]?.type).toBe(CellType.MINE_SAFE);
    expect(state.cells[0]?.[1]?.type).toBe(CellType.MINE_DANGER);
    expect(state.cells[1]?.[0]?.type).toBe(CellType.MINE_SAFE);
    expect(state.cells[1]?.[1]?.type).toBe(CellType.MINE_SAFE);
  });

  it('converted配列に正しいoldType/newTypeが記録されること', () => {
    const cells = createCells([[CellType.SAFE, CellType.WASTELAND, CellType.HOLE]]);
    const state = createState(cells);

    const result = executeErosion(
      state,
      [target(0, 0), target(1, 0), target(2, 0)],
      config({ dangerRatio: 0, wastelandDangerRatio: 1 }),
      () => 0.5,
    );

    expect(result.converted).toEqual([
      { x: 0, y: 0, oldType: CellType.SAFE, newType: CellType.MINE_SAFE },
      { x: 1, y: 0, oldType: CellType.WASTELAND, newType: CellType.MINE_DANGER },
    ]);
  });
});
