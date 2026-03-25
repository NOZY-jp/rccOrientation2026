import { CellType, type Cell } from '../../core/types/cell.ts';

export const DIRECTIONS_8: Array<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: -1 },
];

function isMineField(cell: Cell): boolean {
  return cell.type === CellType.MINE_SAFE || cell.type === CellType.MINE_DANGER;
}

function isFrontlineCellType(cell: Cell): boolean {
  return cell.type === CellType.SAFE || cell.type === CellType.WASTELAND;
}

export function getFrontlineCandidates(
  cells: Cell[][],
  width: number,
  height: number,
  existingWarnings: Set<string>
): Array<{ x: number; y: number }> {
  const candidates: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = cells[y]?.[x];
      if (cell === undefined || !isFrontlineCellType(cell)) {
        continue;
      }

      if (existingWarnings.has(`${x},${y}`)) {
        continue;
      }

      let adjacentToMine = false;

      for (const { dx, dy } of DIRECTIONS_8) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }

        const neighbor = cells[ny]?.[nx];
        if (neighbor !== undefined && isMineField(neighbor)) {
          adjacentToMine = true;
          break;
        }
      }

      if (adjacentToMine) {
        candidates.push({ x, y });
      }
    }
  }

  return candidates.sort((a, b) => {
    if (a.y !== b.y) {
      return a.y - b.y;
    }

    return a.x - b.x;
  });
}

export function selectErosionTargets(
  cells: Cell[][],
  width: number,
  height: number,
  power: number,
  existingWarnings: Set<string>
): Array<{ x: number; y: number }> {
  const candidates = getFrontlineCandidates(cells, width, height, existingWarnings);
  return candidates.slice(0, power);
}
