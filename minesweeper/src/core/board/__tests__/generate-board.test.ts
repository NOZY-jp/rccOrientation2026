import { describe, expect, it } from 'vitest';
import { CellType, GamePhase, type GameState } from '../../types/index.ts';
import { generateBoard } from '../generate-board.ts';

function toStateSignature(state: GameState): string {
  const cellSignature = state.cells
    .map((row) => row.map((cell) => cell.type).join(','))
    .join('|');
  const mineSignature = [...state.mines].sort().join('|');

  return `${cellSignature}::${mineSignature}`;
}

describe('generateBoard', () => {
  it('指定サイズの盤面が生成され、全セル数が width * height になること', () => {
    const state = generateBoard({ width: 7, height: 4, mineCount: 5, seed: 10 });
    const totalCells = state.cells.reduce((sum, row) => sum + row.length, 0);

    expect(state.width).toBe(7);
    expect(state.height).toBe(4);
    expect(state.cells).toHaveLength(4);
    expect(state.cells[0]).toHaveLength(7);
    expect(totalCells).toBe(7 * 4);
  });

  it('指定した地雷数が正確に配置されること', () => {
    const mineCount = 9;
    const state = generateBoard({ width: 8, height: 6, mineCount, seed: 42 });

    expect(state.mines.size).toBe(mineCount);
  });

  it('同じseedの場合、同じ盤面が生成されること', () => {
    // given: 同じ設定値（seedを含む）
    const config = { width: 10, height: 10, mineCount: 15, seed: 12345 };

    // when: 2回盤面を生成する
    const state1 = generateBoard(config);
    const state2 = generateBoard(config);

    // then: 盤面シグネチャが一致する
    expect(toStateSignature(state1)).toBe(toStateSignature(state2));
  });

  it('異なるseedの場合、異なる盤面が生成されること', () => {
    const configA = { width: 10, height: 10, mineCount: 20, seed: 1 };
    const configB = { width: 10, height: 10, mineCount: 20, seed: 2 };

    const state1 = generateBoard(configA);
    const state2 = generateBoard(configB);

    expect(toStateSignature(state1)).not.toBe(toStateSignature(state2));
  });

  it('地雷が盤面外に配置されないこと', () => {
    const state = generateBoard({ width: 9, height: 5, mineCount: 13, seed: 777 });

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

  it('初期状態の全セルが MINE_SAFE または MINE_DANGER であること', () => {
    const state = generateBoard({ width: 6, height: 6, mineCount: 10, seed: 99 });

    for (const row of state.cells) {
      for (const cell of row) {
        expect([CellType.MINE_SAFE, CellType.MINE_DANGER]).toContain(cell.type);
        expect(cell.adjacentMines).toBe(0);
      }
    }
  });

  it('mineCount がセル総数を超える場合にエラーになること', () => {
    expect(() =>
      generateBoard({ width: 3, height: 3, mineCount: 10, seed: 5 })
    ).toThrowError();
  });

  it('初期GameStateの可変コレクションとphaseが期待値であること', () => {
    const state = generateBoard({ width: 5, height: 5, mineCount: 4, seed: 16 });

    expect(state.phase).toBe(GamePhase.PLAYING);
    expect(state.players.size).toBe(0);
    expect(state.flags.size).toBe(0);
  });
});
