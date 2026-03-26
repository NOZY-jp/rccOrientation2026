import { CellType, type Cell } from '../../core/types/cell.ts';
import type { GameState } from '../../core/types/game.ts';
import type { ErosionConfig, WarningCell } from './erosion-types.ts';

export interface ErosionResult {
  converted: Array<{ x: number; y: number; oldType: CellType; newType: CellType }>;
  flagsRemoved: Array<{ x: number; y: number }>;
}

function getCell(cells: Cell[][], x: number, y: number): Cell | undefined {
  const row = cells[y];
  if (!row) {
    return undefined;
  }
  return row[x];
}

/**
 * Execute erosion on specified target cells.
 * - SAFE cells → MINE_SAFE or MINE_DANGER (based on dangerRatio, using random function)
 * - WASTELAND cells → MINE_SAFE or MINE_DANGER (based on wastelandDangerRatio, using random function)
 * - HOLE cells → SKIPPED (not converted)
 * - Already mine cells → SKIPPED (not converted)
 * Side effects:
 *   - Removes flags from converted cells
 *   - Does NOT recalculate numbers (caller responsibility)
 *
 * @param state - GameState (mutated in place)
 * @param targets - Array of WarningCell positions to convert
 * @param config - ErosionConfig for ratios
 * @param random - () => number returning [0, 1) for deterministic randomness
 * @returns ErosionResult with details of conversions and flag removals
 */
export function executeErosion(
  state: GameState,
  targets: Array<WarningCell>,
  config: ErosionConfig,
  random: () => number,
): ErosionResult {
  const converted: Array<{ x: number; y: number; oldType: CellType; newType: CellType }> = [];
  const flagsRemoved: Array<{ x: number; y: number }> = [];

  for (const target of targets) {
    const cell = getCell(state.cells, target.x, target.y);
    if (!cell) {
      continue;
    }

    if (
      cell.type === CellType.HOLE
      || cell.type === CellType.MINE_SAFE
      || cell.type === CellType.MINE_DANGER
    ) {
      continue;
    }

    const oldType = cell.type;
    const ratio = oldType === CellType.WASTELAND ? config.wastelandDangerRatio : config.dangerRatio;
    const newType = random() < ratio ? CellType.MINE_DANGER : CellType.MINE_SAFE;

    cell.type = newType;

    const key = `${target.x},${target.y}`;
    if (newType === CellType.MINE_DANGER) {
      state.mines.add(key);
    }

    if (state.flags.has(key)) {
      state.flags.delete(key);
      flagsRemoved.push({ x: target.x, y: target.y });
    }

    converted.push({
      x: target.x,
      y: target.y,
      oldType,
      newType,
    });
  }

  return {
    converted,
    flagsRemoved,
  };
}
