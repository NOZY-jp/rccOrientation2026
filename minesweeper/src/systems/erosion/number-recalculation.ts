import { CellType, type Cell } from '../../core/types/cell.ts';

const DIRECTIONS_8: Array<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: -1 },
];

function isInBounds(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

function getCell(cells: Cell[][], x: number, y: number): Cell | undefined {
  const row = cells[y];
  if (!row) {
    return undefined;
  }
  return row[x];
}

function countAdjacentDangerMines(cells: Cell[][], x: number, y: number, width: number, height: number): number {
  let count = 0;

  for (const direction of DIRECTIONS_8) {
    const nx = x + direction.dx;
    const ny = y + direction.dy;

    if (!isInBounds(nx, ny, width, height)) {
      continue;
    }

    const adjacent = getCell(cells, nx, ny);
    if (adjacent?.type === CellType.MINE_DANGER) {
      count += 1;
    }
  }

  return count;
}

/**
 * Recalculate adjacentMines for a cell and all its 8 neighbors.
 * Only updates cells that are type SAFE (revealed cells show numbers).
 *
 * @param cells - 2D grid of cells
 * @param centerX - X coordinate of the center cell
 * @param centerY - Y coordinate of the center cell
 * @param width - grid width
 * @param height - grid height
 */
export function recalculateNumbers(
  cells: Cell[][],
  centerX: number,
  centerY: number,
  width: number,
  height: number,
): void {
  const updateTargets: Array<{ x: number; y: number }> = [];

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (!isInBounds(x, y, width, height)) {
        continue;
      }
      updateTargets.push({ x, y });
    }
  }

  for (const target of updateTargets) {
    const cell = getCell(cells, target.x, target.y);
    if (!cell || cell.type !== CellType.SAFE) {
      continue;
    }

    cell.adjacentMines = countAdjacentDangerMines(cells, target.x, target.y, width, height);
  }
}
