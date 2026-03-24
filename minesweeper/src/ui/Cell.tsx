import React from 'react';
import { type Cell as CellData, CellType } from '../core/types/cell';

interface CellProps {
  cell: CellData;
  x: number;
  y: number;
  isGameOver: boolean;
  hasFlag: boolean;
  onClick: (x: number, y: number) => void;
  onRightClick: (x: number, y: number) => void;
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'blue',
  2: 'green',
  3: 'red',
  4: 'purple',
  5: 'brown',
  6: 'cyan',
  7: 'black',
  8: 'gray',
};

export const Cell: React.FC<CellProps> = ({
  cell,
  x,
  y,
  isGameOver,
  hasFlag,
  onClick,
  onRightClick,
}) => {
  const isRevealed = cell.type === CellType.SAFE;
  const isMine = cell.type === CellType.MINE_DANGER;

  let content = '';
  let backgroundColor = '#888';

  if (isRevealed) {
    backgroundColor = '#e0e0e0';
    content = cell.adjacentMines > 0 ? cell.adjacentMines.toString() : '';
  } else if (isGameOver && isMine) {
    backgroundColor = '#ff4444';
    content = '💣';
  } else if (hasFlag) {
    content = '🚩';
  }

  const color = isRevealed && cell.adjacentMines > 0 ? NUMBER_COLORS[cell.adjacentMines] : 'inherit';

  return (
    <button
      type="button"
      onClick={() => onClick(x, y)}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick(x, y);
      }}
      style={{
        width: '32px',
        height: '32px',
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #555',
        boxSizing: 'border-box',
        cursor: isRevealed || isGameOver ? 'default' : 'pointer',
        fontWeight: 'bold',
        color,
        userSelect: 'none',
      }}
      data-testid={`cell-${x}-${y}`}
    >
      {content}
    </button>
  );
};
