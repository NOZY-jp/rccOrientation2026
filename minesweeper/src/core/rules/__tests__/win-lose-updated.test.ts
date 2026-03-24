import { describe, expect, it } from 'vitest';
import { generateBoard } from '../../board/generate-board.ts';
import { revealCell } from '../../board/reveal.ts';
import { CellType, GamePhase, type GameState, type Checkpoint } from '../../types/index.ts';
import { checkWinCondition } from '../win-lose.ts';

function createState(): GameState {
	return generateBoard({ width: 3, height: 3, mineCount: 1, seed: 1 });
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

function createCheckpoint(overrides?: Partial<Checkpoint>): Checkpoint {
	return {
		id: overrides?.id ?? 'cp-0',
		x: overrides?.x ?? 0,
		y: overrides?.y ?? 0,
		collected: overrides?.collected ?? false,
		detectedBy: overrides?.detectedBy ?? new Set<string>(),
	};
}

describe('checkWinCondition updated', () => {
	it('CPが存在し全CP回収済みかつ10フロア未満の場合、FLOOR_CLEARになること', () => {
		const state = createState();
		state.floorNumber = 3;
		state.checkpoints = [createCheckpoint({ id: 'cp-0', collected: true })];

		expect(checkWinCondition(state)).toBe(GamePhase.FLOOR_CLEAR);
	});

	it('CPが存在し全CP回収済みかつ10フロア到達の場合、VICTORYになること', () => {
		const state = createState();
		state.floorNumber = 10;
		state.checkpoints = [createCheckpoint({ id: 'cp-0', collected: true })];

		expect(checkWinCondition(state)).toBe(GamePhase.VICTORY);
	});

	it('CPが存在し未回収CPがある場合、PLAYINGになること', () => {
		const state = createState();
		state.floorNumber = 2;
		state.checkpoints = [
			createCheckpoint({ id: 'cp-0', collected: true }),
			createCheckpoint({ id: 'cp-1', collected: false }),
		];

		expect(checkWinCondition(state)).toBe(GamePhase.PLAYING);
	});

	it('GAME_OVER状態の場合、CPの状態に関わらずGAME_OVERが維持されること', () => {
		const state = createState();
		state.phase = GamePhase.GAME_OVER;
		state.floorNumber = 10;
		state.checkpoints = [createCheckpoint({ id: 'cp-0', collected: true })];

		expect(checkWinCondition(state)).toBe(GamePhase.GAME_OVER);
	});

	it('CPが空配列の場合、従来の全安全セル開拓条件が適用されること', () => {
		const state = createState();
		state.checkpoints = [];
		revealAllSafeCells(state);

		expect(checkWinCondition(state)).toBe(GamePhase.FLOOR_CLEAR);
	});

	it('CPがundefinedの場合、従来の全安全セル開拓条件が適用されること', () => {
		const state = createState();
		revealAllSafeCells(state);

		expect(checkWinCondition(state)).toBe(GamePhase.FLOOR_CLEAR);
	});
});
