import type { Graphics } from 'pixi.js';
import { useCallback } from 'react';
import { CellType } from '../../../core/types/cell';
import { GRID_PADDING } from '../constants';
import { CELL_COLORS, NUMBER_COLORS } from './cellPalette';

interface CellGraphicsProps {
  x: number;
  y: number;
  cellType: CellType;
  adjacentMines: number;
  isFlagged: boolean;
  isGameOver: boolean;
  cellSize: number;
  onReveal?: (x: number, y: number) => void;
  onFlag?: (x: number, y: number) => void;
}

interface CellText {
  text: string;
  color: number;
}

export function CellGraphics({
  x,
  y,
  cellType,
  adjacentMines,
  isFlagged,
  isGameOver,
  cellSize,
  onReveal,
  onFlag,
}: CellGraphicsProps) {
  const positionX = x * cellSize + GRID_PADDING;
  const positionY = y * cellSize + GRID_PADDING;
  const isRevealed = cellType === CellType.SAFE;
  const isGameOverMine = cellType === CellType.MINE_DANGER && isGameOver;

  let fillColor: number = CELL_COLORS.uncovered;
  let cellText: CellText | null = null;

  if (isGameOverMine) {
    fillColor = CELL_COLORS.gameover;
    cellText = { text: '💣', color: 0xffffff };
  } else if (isFlagged) {
    fillColor = CELL_COLORS.uncovered;
    cellText = { text: '🚩', color: CELL_COLORS.flag };
  } else if (isRevealed) {
    fillColor = CELL_COLORS.safe;
    if (adjacentMines > 0) {
      cellText = { text: adjacentMines.toString(), color: NUMBER_COLORS[adjacentMines] ?? 0x111827 };
    }
  }

  const drawCell = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.setFillStyle({ color: fillColor });
      graphics.rect(0, 0, cellSize, cellSize);
      graphics.fill();

      graphics.setStrokeStyle({ color: 0x4b5563, width: 1 });
      graphics.rect(0, 0, cellSize, cellSize);
      graphics.stroke();
    },
    [cellSize, fillColor]
  );

  const handlePointerDown = useCallback(
    (event: { button?: number; preventDefault?: () => void }) => {
      if (event.button === 2) {
        event.preventDefault?.();
        onFlag?.(x, y);
        return;
      }

      if (event.button === 0) {
        onReveal?.(x, y);
      }
    },
    [onFlag, onReveal, x, y]
  );

  return (
    <>
      <pixiGraphics
        x={positionX}
        y={positionY}
        draw={drawCell}
        eventMode="static"
        onPointerDown={handlePointerDown}
      />
      {cellText ? (
        <pixiText
          text={cellText.text}
          x={positionX + cellSize / 2}
          y={positionY + cellSize / 2}
          anchor={0.5}
          style={{
            fill: cellText.color,
            fontFamily: 'monospace',
            fontSize: Math.floor(cellSize * 0.56),
            fontWeight: '700',
            align: 'center',
          }}
        />
      ) : null}
    </>
  );
}
