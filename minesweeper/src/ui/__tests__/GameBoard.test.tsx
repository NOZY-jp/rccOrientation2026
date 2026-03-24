import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameBoard } from '../GameBoard';
import { GamePhase, type GameState } from '../../core/types/game';
import { CellType } from '../../core/types/cell';

const createState = (): GameState => ({
  width: 3,
  height: 3,
  phase: GamePhase.PLAYING,
  players: new Map(),
  mines: new Set(['1,1']),
  flags: new Set(['0,0']),
  cells: [
    [
      { type: CellType.MINE_SAFE, adjacentMines: 0 },
      { type: CellType.SAFE, adjacentMines: 1 },
      { type: CellType.MINE_SAFE, adjacentMines: 0 },
    ],
    [
      { type: CellType.SAFE, adjacentMines: 1 },
      { type: CellType.MINE_DANGER, adjacentMines: 0 },
      { type: CellType.SAFE, adjacentMines: 1 },
    ],
    [
      { type: CellType.MINE_SAFE, adjacentMines: 0 },
      { type: CellType.SAFE, adjacentMines: 1 },
      { type: CellType.MINE_SAFE, adjacentMines: 0 },
    ],
  ],
});

describe('GameBoard', () => {
  it('renders the correct number of cells', () => {
    const state = createState();
    render(<GameBoard state={state} onCellClick={() => {}} onCellRightClick={() => {}} />);
    
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(9);
  });

  it('hides mine cells when playing', () => {
    const state = createState();
    render(<GameBoard state={state} onCellClick={() => {}} onCellRightClick={() => {}} />);
    
    const mineCell = screen.getByTestId('cell-1-1');
    expect(mineCell).not.toHaveTextContent('💣');
  });

  it('shows numbers for revealed cells', () => {
    const state = createState();
    render(<GameBoard state={state} onCellClick={() => {}} onCellRightClick={() => {}} />);
    
    const revealedCell = screen.getByTestId('cell-1-0');
    expect(revealedCell).toHaveTextContent('1');
  });

  it('shows flags correctly', () => {
    const state = createState();
    render(<GameBoard state={state} onCellClick={() => {}} onCellRightClick={() => {}} />);
    
    const flaggedCell = screen.getByTestId('cell-0-0');
    expect(flaggedCell).toHaveTextContent('🚩');
  });
  
  it('shows mines when game is over', () => {
    const state = createState();
    state.phase = GamePhase.GAME_OVER;
    render(<GameBoard state={state} onCellClick={() => {}} onCellRightClick={() => {}} />);
    
    const mineCell = screen.getByTestId('cell-1-1');
    expect(mineCell).toHaveTextContent('💣');
  });
});
