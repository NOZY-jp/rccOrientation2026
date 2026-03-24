import { useEffect, useState } from 'react';
import { generateBoard } from './core/board/generate-board';
import { revealCell } from './core/board/reveal';
import { toggleFlag } from './core/board/flag';
import { checkWinCondition } from './core/rules/win-lose';
import { GamePhase } from './core/types/game';
import { GameBoard } from './ui/GameBoard';
import { GameStatus } from './ui/GameStatus';
import { PixiCanvas } from './ui/pixi/PixiCanvas';
import { CELL_SIZE, GRID_PADDING } from './ui/pixi/constants';

const DEFAULT_CONFIG = { width: 9, height: 9, mineCount: 10, seed: 42 };

export default function App() {
  const [state, setState] = useState(() => generateBoard(DEFAULT_CONFIG));
  const pixiWidth = state.width * CELL_SIZE + GRID_PADDING * 2;
  const pixiHeight = state.height * CELL_SIZE + GRID_PADDING * 2;

  useEffect(() => {
    document.body.style.backgroundColor = '#2a2a2a';
    document.body.style.margin = '0';
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
  }, []);

  const handleCellClick = (x: number, y: number) => {
    if (state.phase !== GamePhase.PLAYING) return;

    const newState = structuredClone(state);
    revealCell(newState, x, y);
    newState.phase = checkWinCondition(newState);
    setState(newState);
  };

  const handleCellRightClick = (x: number, y: number) => {
    if (state.phase !== GamePhase.PLAYING) return;

    const newState = structuredClone(state);
    toggleFlag(newState, x, y);
    setState(newState);
  };

  const handleNewGame = () => {
    setState(generateBoard({ ...DEFAULT_CONFIG, seed: Date.now() }));
  };

  return (
    <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ color: 'white', textAlign: 'center', margin: 0 }}>Minesweeper</h1>
      <GameStatus
        phase={state.phase}
        mineCount={DEFAULT_CONFIG.mineCount}
        flagCount={state.flags.size}
        onNewGame={handleNewGame}
      />
      <GameBoard
        state={state}
        onCellClick={handleCellClick}
        onCellRightClick={handleCellRightClick}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ color: '#cbd5e1', fontSize: '14px', textAlign: 'center' }}>PixiJS Canvas (D2 setup)</span>
        <PixiCanvas width={pixiWidth} height={pixiHeight} />
      </div>
    </div>
  );
}
