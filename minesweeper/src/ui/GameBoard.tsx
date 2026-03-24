import React from 'react';
import { GamePhase, type GameState } from '../core/types/game';
import { Cell } from './Cell';

interface GameBoardProps {
  state: GameState;
  onCellClick: (x: number, y: number) => void;
  onCellRightClick: (x: number, y: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  onCellClick,
  onCellRightClick,
}) => {
  const isGameOver = state.phase === GamePhase.GAME_OVER;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${state.width}, 1fr)`,
        width: 'max-content',
        border: '1px solid #555',
        backgroundColor: '#555',
        margin: '0 auto',
      }}
      data-testid="game-board"
    >
      {state.cells.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const cellKey = `cell-${colIdx}-${rowIdx}`;
          return (
            <Cell
              key={cellKey}
              cell={cell}
              x={colIdx}
              y={rowIdx}
              isGameOver={isGameOver}
              hasFlag={state.flags.has(`${colIdx},${rowIdx}`)}
              onClick={onCellClick}
              onRightClick={onCellRightClick}
            />
          );
        })
      )}
    </div>
  );
};
