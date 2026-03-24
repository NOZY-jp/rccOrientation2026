import { describe, expect, it } from 'vitest';
import { CellType, GamePhase } from '../../types/index.ts';
import { countAdjacentMines } from '../adjacent-mines.ts';
import { generateBoard } from '../generate-board.ts';
import { revealCell } from '../reveal.ts';

function createState(width: number, height: number) {
	return generateBoard({ width, height, mineCount: 0, seed: 1 });
}

function setMine(state: ReturnType<typeof createState>, x: number, y: number): void {
	const row = state.cells[y];
	if (row === undefined) {
		throw new Error('行が存在しません');
	}

	const cell = row[x];
	if (cell === undefined) {
		throw new Error('セルが存在しません');
	}

	cell.type = CellType.MINE_DANGER;
	state.mines.add(`${x},${y}`);
}

function setSafeCandidate(
	state: ReturnType<typeof createState>,
	x: number,
	y: number,
): void {
	const row = state.cells[y];
	if (row === undefined) {
		throw new Error('行が存在しません');
	}

	const cell = row[x];
	if (cell === undefined) {
		throw new Error('セルが存在しません');
	}

	cell.type = CellType.MINE_SAFE;
	cell.adjacentMines = 0;
	state.mines.delete(`${x},${y}`);
}

describe('countAdjacentMines', () => {
	it('8方向の mine_danger のみをカウントし、盤面外は無視すること', () => {
		const state = createState(3, 3);
		setMine(state, 0, 0);
		setMine(state, 1, 0);
		setMine(state, 2, 1);

		expect(countAdjacentMines(state, 1, 1)).toBe(3);
		expect(countAdjacentMines(state, 0, 0)).toBe(1);
	});
});

describe('revealCell', () => {
	it('mine_safeセルを開拓した場合、safeになり隣接地雷数が表示されること', () => {
		// given: 対象セルの隣に地雷を1つ置く
		const state = createState(3, 3);
		setMine(state, 0, 0);

		// when: mine_safeセルを開拓する
		const result = revealCell(state, 1, 1);

		// then: safeに変化し、隣接地雷数が設定される
		expect(result.gameOver).toBe(false);
		expect(result.hitMine).toBe(false);
		expect(result.revealed).toEqual([{ x: 1, y: 1, adjacentMines: 1 }]);
		expect(state.cells[1]?.[1]?.type).toBe(CellType.SAFE);
		expect(state.cells[1]?.[1]?.adjacentMines).toBe(1);
		expect(state.phase).toBe(GamePhase.PLAYING);
	});

	it('mine_dangerセルを開拓した場合、GAME_OVERになること', () => {
		const state = createState(2, 2);
		setMine(state, 1, 1);

		const result = revealCell(state, 1, 1);

		expect(result.revealed).toEqual([]);
		expect(result.gameOver).toBe(true);
		expect(result.hitMine).toBe(true);
		expect(state.phase).toBe(GamePhase.GAME_OVER);
		expect(state.cells[1]?.[1]?.type).toBe(CellType.MINE_DANGER);
	});

	it('safeセルを開拓した場合、何も変わらないこと', () => {
		const state = createState(3, 3);
		const target = state.cells[1]?.[1];
		if (target === undefined) {
			throw new Error('対象セルが存在しません');
		}
		target.type = CellType.SAFE;
		target.adjacentMines = 2;

		const result = revealCell(state, 1, 1);

		expect(result).toEqual({ revealed: [], gameOver: false, hitMine: false });
		expect(state.cells[1]?.[1]?.type).toBe(CellType.SAFE);
		expect(state.cells[1]?.[1]?.adjacentMines).toBe(2);
		expect(state.phase).toBe(GamePhase.PLAYING);
	});

	it('隣接地雷数0の mine_safe を開拓した場合、flood-fillで連鎖開拓されること', () => {
		const state = createState(4, 4);

		const result = revealCell(state, 0, 0);

		expect(result.gameOver).toBe(false);
		expect(result.hitMine).toBe(false);
		expect(result.revealed).toHaveLength(16);
		for (const row of state.cells) {
			for (const cell of row) {
				expect(cell.type).toBe(CellType.SAFE);
				expect(cell.adjacentMines).toBe(0);
			}
		}
	});

	it('flood-fill は地雷原で停止し、安全マスだけを展開すること', () => {
		const state = createState(4, 4);
		setMine(state, 3, 3);

		const result = revealCell(state, 0, 0);

		expect(result.gameOver).toBe(false);
		expect(result.hitMine).toBe(false);
		expect(state.cells[3]?.[3]?.type).toBe(CellType.MINE_DANGER);
		expect(result.revealed.some((item) => item.x === 3 && item.y === 3)).toBe(false);
		expect(result.revealed).toHaveLength(15);
		expect(state.cells[2]?.[2]?.type).toBe(CellType.SAFE);
		expect(state.cells[2]?.[2]?.adjacentMines).toBe(1);
	});

	it('旗が立っているセルは開拓不可であること', () => {
		const state = createState(3, 3);
		state.flags.add('1,1');

		const result = revealCell(state, 1, 1);

		expect(result).toEqual({ revealed: [], gameOver: false, hitMine: false });
		expect(state.cells[1]?.[1]?.type).toBe(CellType.MINE_SAFE);
		expect(state.phase).toBe(GamePhase.PLAYING);
	});

	it('既に開拓済みのセルを開拓した場合、何も変わらないこと', () => {
		const state = createState(3, 3);
		const target = state.cells[2]?.[1];
		if (target === undefined) {
			throw new Error('対象セルが存在しません');
		}
		target.type = CellType.SAFE;
		target.adjacentMines = 0;

		const result = revealCell(state, 1, 2);

		expect(result).toEqual({ revealed: [], gameOver: false, hitMine: false });
		expect(state.cells[2]?.[1]?.type).toBe(CellType.SAFE);
		expect(state.cells[2]?.[1]?.adjacentMines).toBe(0);
	});

	it('盤面端でのflood-fillが境界を超えないこと', () => {
		const state = createState(2, 2);

		const result = revealCell(state, 0, 0);

		expect(result.revealed).toHaveLength(4);
		expect(state.cells[0]?.[0]?.type).toBe(CellType.SAFE);
		expect(state.cells[0]?.[1]?.type).toBe(CellType.SAFE);
		expect(state.cells[1]?.[0]?.type).toBe(CellType.SAFE);
		expect(state.cells[1]?.[1]?.type).toBe(CellType.SAFE);
	});

	it('盤面外の座標を開拓した場合、何も変わらないこと', () => {
		const state = createState(3, 3);

		const before = state.cells.map((row) => row.map((cell) => ({ ...cell })));
		const result = revealCell(state, -1, 4);

		expect(result).toEqual({ revealed: [], gameOver: false, hitMine: false });
		expect(state.cells).toEqual(before);
		expect(state.phase).toBe(GamePhase.PLAYING);
	});

	it('flood-fill中は旗セルを展開しないこと', () => {
		const state = createState(3, 3);
		state.flags.add('1,1');

		const result = revealCell(state, 0, 0);

		expect(result.revealed.some((item) => item.x === 1 && item.y === 1)).toBe(false);
		expect(state.cells[1]?.[1]?.type).toBe(CellType.MINE_SAFE);
		expect(result.revealed).toHaveLength(8);
	});

	it('flood-fillで地雷に隣接するセルは開くが、それ以上は連鎖しないこと', () => {
		const state = createState(5, 3);
		setMine(state, 4, 1);
		setSafeCandidate(state, 3, 1);

		const result = revealCell(state, 0, 1);

		expect(result.revealed).toHaveLength(12);
		expect(result.revealed.some((item) => item.x === 3 && item.y === 1)).toBe(true);
		expect(state.cells[1]?.[3]?.type).toBe(CellType.SAFE);
		expect(state.cells[1]?.[3]?.adjacentMines).toBe(1);
		expect(state.cells[0]?.[4]?.type).toBe(CellType.MINE_SAFE);
		expect(state.cells[2]?.[4]?.type).toBe(CellType.MINE_SAFE);
		expect(result.revealed.some((item) => item.x === 4 && item.y === 1)).toBe(false);
		expect(state.cells[1]?.[4]?.type).toBe(CellType.MINE_DANGER);
	});
});
