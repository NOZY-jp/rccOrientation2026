import type { GameState } from '../types/index.ts';
import { CellType, GamePhase } from '../types/index.ts';

function checkWinConditionPrototype(state: GameState): GamePhase {
	if (state.phase === GamePhase.GAME_OVER) {
		return GamePhase.GAME_OVER;
	}

	let unrevealedSafeCellCount = 0;

	for (const row of state.cells) {
		for (const cell of row) {
			if (cell.type !== CellType.MINE_DANGER && cell.type !== CellType.SAFE) {
				unrevealedSafeCellCount += 1;
			}
		}
	}

	if (unrevealedSafeCellCount === 0) {
		return GamePhase.FLOOR_CLEAR;
	}

	return GamePhase.PLAYING;
}

export function checkWinCondition(state: GameState): GamePhase {
	return checkWinConditionPrototype(state);
}
