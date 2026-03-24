import { useCallback, useState } from 'react';

interface CursorState {
  x: number;
  y: number;
}

interface UseCursorReturn {
  cursor: CursorState;
  moveCursor: (dx: number, dy: number, maxWidth: number, maxHeight: number) => void;
  setCursor: (x: number, y: number) => void;
}

export function useCursor(initialX: number, initialY: number): UseCursorReturn {
  const [cursor, setCursorState] = useState<CursorState>({ x: initialX, y: initialY });

  const moveCursor = useCallback((dx: number, dy: number, maxWidth: number, maxHeight: number) => {
    setCursorState((prev) => ({
      x: Math.max(0, Math.min(maxWidth - 1, prev.x + dx)),
      y: Math.max(0, Math.min(maxHeight - 1, prev.y + dy)),
    }));
  }, []);

  const setCursor = useCallback((x: number, y: number) => {
    setCursorState({ x, y });
  }, []);

  return { cursor, moveCursor, setCursor };
}
