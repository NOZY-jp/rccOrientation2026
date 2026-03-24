import type { Checkpoint } from '../../core/types/index.ts';

export interface CheckpointConfig {
  detectionRadius: number;
}

export function detectCheckpoints(
  playerX: number,
  playerY: number,
  checkpoints: Checkpoint[],
  playerId: string,
  config: CheckpointConfig
): Checkpoint[] {
  const detected: Checkpoint[] = [];
  const radiusSquared = config.detectionRadius * config.detectionRadius;

  for (const checkpoint of checkpoints) {
    if (checkpoint.collected) {
      continue;
    }

    if (checkpoint.detectedBy.has(playerId)) {
      continue;
    }

    const centerX = checkpoint.x + 0.5;
    const centerY = checkpoint.y + 0.5;
    const dx = playerX - centerX;
    const dy = playerY - centerY;
    const distSquared = dx * dx + dy * dy;

    if (distSquared > radiusSquared) {
      continue;
    }

    checkpoint.detectedBy.add(playerId);
    detected.push(checkpoint);
  }

  return detected;
}

export function collectCheckpoints(
  playerX: number,
  playerY: number,
  checkpoints: Checkpoint[]
): { collected: Checkpoint[]; allCollected: boolean } {
  const collected: Checkpoint[] = [];
  const playerCellX = Math.floor(playerX);
  const playerCellY = Math.floor(playerY);

  for (const checkpoint of checkpoints) {
    if (checkpoint.collected) {
      continue;
    }

    if (playerCellX !== checkpoint.x || playerCellY !== checkpoint.y) {
      continue;
    }

    checkpoint.collected = true;
    collected.push(checkpoint);
  }

  const allCollected = checkpoints.every((checkpoint) => checkpoint.collected);
  return { collected, allCollected };
}
