import { GamePhase, type GameState } from '../../../core/types/game';
import type { WarningCell } from '../../../systems/erosion/erosion-types';
import { CELL_SIZE, GRID_PADDING } from '../constants';
import { CellGraphics } from './CellGraphics';
import { ErosionWarningOverlay } from './ErosionWarningOverlay';

interface GridRendererProps {
  state: GameState;
  cursorPosition?: { x: number; y: number } | null;
  onReveal?: (x: number, y: number) => void;
  onFlag?: (x: number, y: number) => void;
  pendingWarnings?: WarningCell[];
}

export function GridRenderer({ state, cursorPosition = null, onReveal, onFlag, pendingWarnings = [] }: GridRendererProps) {
  const isGameOver = state.phase === GamePhase.GAME_OVER;
  const cellViews = state.cells.flatMap((row, y) =>
    row.map((cell, x) => ({
      key: `${x},${y}`,
      x,
      y,
      cell,
    }))
  );

  return (
    <>
      {cellViews.map((view) => (
        <CellGraphics
          key={`pixi-cell-${view.key}`}
          x={view.x}
          y={view.y}
          cellType={view.cell.type}
          adjacentMines={view.cell.adjacentMines}
          isFlagged={state.flags.has(view.key)}
          isGameOver={isGameOver}
          isCursorHighlighted={
            cursorPosition !== null && view.x === cursorPosition.x && view.y === cursorPosition.y
          }
          cellSize={CELL_SIZE}
          onReveal={onReveal}
          onFlag={onFlag}
        />
      ))}
      {state.checkpoints?.filter(cp => cp.detectedBy.size > 0).map(cp => (
        <pixiGraphics
          key={`cp-${cp.id}`}
          x={cp.x * CELL_SIZE + GRID_PADDING}
          y={cp.y * CELL_SIZE + GRID_PADDING}
          draw={g => {
            g.clear();
            if (cp.collected) {
              g.circle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 3);
              g.fill({ color: 0x4caf50, alpha: 0.6 });
            } else {
              g.circle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 3);
              g.fill({ color: 0xff9800, alpha: 0.7 });
              g.circle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2.5);
              g.stroke({ color: 0xffeb3b, width: 2, alpha: 0.5 });
            }
          }}
        />
      ))}
      {pendingWarnings.length > 0 && (
        <ErosionWarningOverlay pendingWarnings={pendingWarnings} cellSize={CELL_SIZE} />
      )}
    </>
  );
}
