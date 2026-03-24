import { describe, expect, it } from 'vitest';
import { toggleFlag } from '../../board/flag.ts';
import { generateBoard } from '../../board/generate-board.ts';
import { revealCell } from '../../board/reveal.ts';
import { CellType, GamePhase, type GameState } from '../../types/index.ts';
import { checkWinCondition } from '../win-lose.ts';

function createState(): GameState {
	return generateBoard({ width: 3, height: 3, mineCount: 1, seed: 1 });
}

function findMinePosition(state: GameState): { x: number; y: number } {
	for (const mine of state.mines) {
		const [xText = '', yText = ''] = mine.split(',');
		const x = Number.parseInt(xText, 10);
		const y = Number.parseInt(yText, 10);

		if (!Number.isNaN(x) && !Number.isNaN(y)) {
			return { x, y };
		}
	}

	throw new Error('地雷座標が見つかりません');
}

function revealAllSafeCells(state: GameState): void {
	for (let y = 0; y < state.height; y += 1) {
		for (let x = 0; x < state.width; x += 1) {
			const row = state.cells[y];
			if (row === undefined) {
				continue;
			}

			const cell = row[x];
			if (cell === undefined || cell.type === CellType.MINE_DANGER) {
				continue;
			}

			revealCell(state, x, y);
		}
	}
}

function findSafeCellPosition(state: GameState): { x: number; y: number } {
	for (let y = 0; y < state.height; y += 1) {
		for (let x = 0; x < state.width; x += 1) {
			const row = state.cells[y];
			if (row === undefined) {
				continue;
			}

			const cell = row[x];
			if (cell !== undefined && cell.type !== CellType.MINE_DANGER) {
				return { x, y };
			}
		}
	}

	throw new Error('安全セル座標が見つかりません');
}

describe('checkWinCondition prototype', () => {
	it('全安全セルが開拓済みの場合、FLOOR_CLEARになること', () => {
		const state = createState();
		// given: 地雷以外のセルをすべて開拓済みにする
		revealAllSafeCells(state);

		// when: 勝敗判定（プロトタイプ）を評価する
		const phase = checkWinCondition(state);

		// then: FLOOR_CLEAR になる
		expect(phase).toBe(GamePhase.FLOOR_CLEAR);
	});

	it('地雷を踏んでGAME_OVERの場合、GAME_OVERのままであること', () => {
		const state = createState();
		const mine = findMinePosition(state);

		revealCell(state, mine.x, mine.y);

		expect(state.phase).toBe(GamePhase.GAME_OVER);
		expect(checkWinCondition(state)).toBe(GamePhase.GAME_OVER);
	});

	it('盤面途中の場合、PLAYINGになること', () => {
		const state = createState();
		const safe = findSafeCellPosition(state);

		revealCell(state, safe.x, safe.y);

		expect(checkWinCondition(state)).toBe(GamePhase.PLAYING);
	});

	it('旗を立てただけの場合、開拓済みとみなされずPLAYINGになること', () => {
		const state = createState();
		const safe = findSafeCellPosition(state);

		toggleFlag(state, safe.x, safe.y);

		expect(checkWinCondition(state)).toBe(GamePhase.PLAYING);
	});

	it('1セルも開拓していない初期状態ではPLAYINGになること', () => {
		const state = createState();

		expect(checkWinCondition(state)).toBe(GamePhase.PLAYING);
	});
});
