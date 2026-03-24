import {
	type BoardConfig,
	CellType,
	GamePhase,
	type GameState,
} from "../types/index.ts";
import { createSeededRandom } from "./seed-random.ts";

export function generateBoard(config: BoardConfig): GameState {
	const { width, height, mineCount, seed } = config;
	const totalCells = width * height;

	if (mineCount > totalCells) {
		throw new Error("mineCount はセル総数以下である必要があります");
	}

	const cells = Array.from({ length: height }, () =>
		Array.from({ length: width }, () => ({
			type: CellType.MINE_SAFE,
			adjacentMines: 0,
		})),
	);

	const mines = new Set<string>();
	const random = createSeededRandom(seed);

	while (mines.size < mineCount) {
		const x = Math.floor(random() * width);
		const y = Math.floor(random() * height);
		const key = `${x},${y}`;

		if (mines.has(key)) {
			continue;
		}

		mines.add(key);

		const targetRow = cells[y];
		if (targetRow === undefined) {
			continue;
		}

		const targetCell = targetRow[x];
		if (targetCell === undefined) {
			continue;
		}

		targetCell.type = CellType.MINE_DANGER;
	}

	return {
		width,
		height,
		cells,
		players: new Map(),
		phase: GamePhase.PLAYING,
		mines,
		flags: new Set<string>(),
	};
}
