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

function isMineType(type: CellType): boolean {
  return type === CellType.MINE_SAFE || type === CellType.MINE_DANGER;
}

function isFrontlineType(type: CellType): boolean {
  return type === CellType.SAFE || type === CellType.WASTELAND;
}

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

function toKey(x: number, y: number): string {
  return `${x},${y}`;
}

function sortByScanOrder(candidates: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  return [...candidates].sort((a, b) => {
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
}

export function getFrontlineCandidates(
  cells: Cell[][],
  width: number,
  height: number,
  excludeWarnings?: Set<string>,
): Array<{ x: number; y: number }> {
  const results: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = toKey(x, y);
      if (excludeWarnings?.has(key)) {
        continue;
      }

      const cell = getCell(cells, x, y);
      if (!cell || !isFrontlineType(cell.type)) {
        continue;
      }

      let hasAdjacentMine = false;
      for (const direction of DIRECTIONS_8) {
        const nx = x + direction.dx;
        const ny = y + direction.dy;
        if (!isInBounds(nx, ny, width, height)) {
          continue;
        }

        const adjacentCell = getCell(cells, nx, ny);
        if (adjacentCell && isMineType(adjacentCell.type)) {
          hasAdjacentMine = true;
          break;
        }
      }

      if (hasAdjacentMine) {
        results.push({ x, y });
      }
    }
  }

  return results;
}

export function selectErosionTargets(
  cells: Cell[][],
  width: number,
  height: number,
  power: number,
  excludeWarnings: Set<string>,
): Array<{ x: number; y: number }> {
  if (power <= 0) {
    return [];
  }

  const frontline = getFrontlineCandidates(cells, width, height, excludeWarnings);
  if (frontline.length === 0) {
    return [];
  }

  const selected = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();
  const queue: Array<{ x: number; y: number }> = [];

  for (const candidate of frontline) {
    const key = toKey(candidate.x, candidate.y);
    selected.set(key, candidate);
    visited.add(key);
    queue.push(candidate);
  }

  while (selected.size < power && queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    for (const direction of DIRECTIONS_8) {
      const nx = current.x + direction.dx;
      const ny = current.y + direction.dy;
      if (!isInBounds(nx, ny, width, height)) {
        continue;
      }

      const key = toKey(nx, ny);
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      if (excludeWarnings.has(key)) {
        continue;
      }

      const nextCell = getCell(cells, nx, ny);
      if (!nextCell || !isFrontlineType(nextCell.type)) {
        continue;
      }

      const next = { x: nx, y: ny };
      selected.set(key, next);
      queue.push(next);

      if (selected.size >= power) {
        break;
      }
    }
  }

  return sortByScanOrder(Array.from(selected.values())).slice(0, power);
}

export { DIRECTIONS_8 };
