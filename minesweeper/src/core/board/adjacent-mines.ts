import { CellType, type GameState } from '../types/index.ts';

export function countAdjacentMines(state: GameState, x: number, y: number): number {
	let count = 0;

	for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
		for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
			if (offsetX === 0 && offsetY === 0) {
				continue;
			}

			const nextX = x + offsetX;
			const nextY = y + offsetY;

			if (nextX < 0 || nextX >= state.width || nextY < 0 || nextY >= state.height) {
				continue;
			}

			const targetRow = state.cells[nextY];
			if (targetRow === undefined) {
				continue;
			}

			const targetCell = targetRow[nextX];
			if (targetCell === undefined) {
				continue;
			}

			if (targetCell.type === CellType.MINE_DANGER) {
				count += 1;
			}
		}
	}

	return count;
}
