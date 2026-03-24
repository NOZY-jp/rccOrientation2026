import React from 'react';
import { GamePhase } from '../core/types/game';

interface GameStatusProps {
  phase: GamePhase;
  mineCount: number;
  flagCount: number;
  onNewGame: () => void;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  phase,
  mineCount,
  flagCount,
  onNewGame,
}) => {
  const remainingMines = mineCount - flagCount;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '18px',
        width: 'max-content',
        minWidth: '288px',
        margin: '0 auto',
      }}
    >
      <div>
        {phase === GamePhase.PLAYING && `プレイ中 (残り地雷: ${remainingMines})`}
        {phase === GamePhase.GAME_OVER && 'ゲームオーバー 💥'}
        {phase === GamePhase.FLOOR_CLEAR && 'クリア！🎉'}
      </div>
      {(phase === GamePhase.GAME_OVER || phase === GamePhase.FLOOR_CLEAR) ? (
        <button
          type="button"
          onClick={onNewGame}
          style={{
            padding: '5px 10px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '16px',
          }}
        >
          New Game
        </button>
      ) : (
        <button
          type="button"
          onClick={onNewGame}
          style={{
            padding: '5px 10px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '16px',
          }}
        >
          Reset
        </button>
      )}
    </div>
  );
};
