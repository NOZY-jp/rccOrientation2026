import { CellType, type Cell, type Checkpoint } from '../types/index.ts';
import { createSeededRandom } from './seed-random.ts';

export function placeCheckpoints(
  cells: Cell[][],
  candidates: boolean[][],
  seed: number
): Checkpoint[] {
  const positions: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < candidates.length; y += 1) {
    const candidateRow = candidates[y];
    if (candidateRow === undefined) {
      continue;
    }

    for (let x = 0; x < candidateRow.length; x += 1) {
      if (candidateRow[x] !== true) {
        continue;
      }

      const cell = cells[y]?.[x];
      if (cell === undefined) {
        continue;
      }

      if (cell.type === CellType.HOLE) {
        continue;
      }

      positions.push({ x, y });
    }
  }

  const random = createSeededRandom(seed);

  for (let i = positions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = positions[i];
    const selected = positions[j];
    if (current === undefined || selected === undefined) {
      continue;
    }
    positions[i] = selected;
    positions[j] = current;
  }

  return positions.map((position, index) => ({
    id: `cp-${index}`,
    x: position.x,
    y: position.y,
    collected: false,
    detectedBy: new Set<string>(),
  }));
}
