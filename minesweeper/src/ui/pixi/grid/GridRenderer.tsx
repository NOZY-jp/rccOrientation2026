import { GamePhase, type GameState } from '../../../core/types/game';
import { CELL_SIZE } from '../constants';
import { CellGraphics } from './CellGraphics';

interface GridRendererProps {
  state: GameState;
}

export function GridRenderer({ state }: GridRendererProps) {
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
          cellSize={CELL_SIZE}
        />
      ))}
    </>
  );
}
