import { CellType, GamePhase, type GameState } from '../types/index.ts';
import { countAdjacentMines } from './adjacent-mines.ts';

interface Position {
	x: number;
	y: number;
}

export interface RevealResult {
	revealed: Array<{ x: number; y: number; adjacentMines: number }>;
	gameOver: boolean;
	hitMine: boolean;
}

function isWithinBounds(state: GameState, x: number, y: number): boolean {
	return x >= 0 && x < state.width && y >= 0 && y < state.height;
}

export function revealCell(state: GameState, x: number, y: number): RevealResult {
	if (!isWithinBounds(state, x, y)) {
		return { revealed: [], gameOver: false, hitMine: false };
	}

	const startKey = `${x},${y}`;
	if (state.flags.has(startKey)) {
		return { revealed: [], gameOver: false, hitMine: false };
	}

	const startRow = state.cells[y];
	if (startRow === undefined) {
		return { revealed: [], gameOver: false, hitMine: false };
	}

	const startCell = startRow[x];
	if (startCell === undefined) {
		return { revealed: [], gameOver: false, hitMine: false };
	}

	if (startCell.type === CellType.SAFE) {
		return { revealed: [], gameOver: false, hitMine: false };
	}

	if (startCell.type === CellType.MINE_DANGER) {
		state.phase = GamePhase.GAME_OVER;
		return { revealed: [], gameOver: true, hitMine: true };
	}

	const revealed: Array<{ x: number; y: number; adjacentMines: number }> = [];
	const queue: Position[] = [{ x, y }];
	const visited = new Set<string>([startKey]);

	while (queue.length > 0) {
		const current = queue.shift();
		if (current === undefined) {
			continue;
		}

		const currentRow = state.cells[current.y];
		if (currentRow === undefined) {
			continue;
		}

		const currentCell = currentRow[current.x];
		if (currentCell === undefined) {
			continue;
		}

		if (currentCell.type !== CellType.MINE_SAFE) {
			continue;
		}

		const adjacentMines = countAdjacentMines(state, current.x, current.y);
		currentCell.type = CellType.SAFE;
		currentCell.adjacentMines = adjacentMines;
		revealed.push({ x: current.x, y: current.y, adjacentMines });

		if (adjacentMines !== 0) {
			continue;
		}

		for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
			for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
				if (offsetX === 0 && offsetY === 0) {
					continue;
				}

				const nextX = current.x + offsetX;
				const nextY = current.y + offsetY;
				const nextKey = `${nextX},${nextY}`;

				if (!isWithinBounds(state, nextX, nextY)) {
					continue;
				}

				if (visited.has(nextKey) || state.flags.has(nextKey)) {
					continue;
				}

				const nextRow = state.cells[nextY];
				if (nextRow === undefined) {
					continue;
				}

				const nextCell = nextRow[nextX];
				if (nextCell === undefined || nextCell.type !== CellType.MINE_SAFE) {
					continue;
				}

				visited.add(nextKey);
				queue.push({ x: nextX, y: nextY });
			}
		}
	}

	return { revealed, gameOver: false, hitMine: false };
}
