import { useEffect } from 'react';
import { KEY_BINDINGS } from './keyboardBindings';

interface UseKeyboardInputOptions {
  onDig: () => void;
  onFlag: () => void;
  onDetonate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  enabled?: boolean;
}

export function useKeyboardInput({
  onDig,
  onFlag,
  onDetonate,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  enabled = true,
}: UseKeyboardInputOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      switch (event.code) {
        case KEY_BINDINGS.dig:
          event.preventDefault();
          onDig();
          break;
        case KEY_BINDINGS.flag:
          event.preventDefault();
          onFlag();
          break;
        case KEY_BINDINGS.detonate:
          event.preventDefault();
          onDetonate();
          break;
        case KEY_BINDINGS.up:
          event.preventDefault();
          onMoveUp();
          break;
        case KEY_BINDINGS.down:
          event.preventDefault();
          onMoveDown();
          break;
        case KEY_BINDINGS.left:
          event.preventDefault();
          onMoveLeft();
          break;
        case KEY_BINDINGS.right:
          event.preventDefault();
          onMoveRight();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDig, onFlag, onDetonate, onMoveUp, onMoveDown, onMoveLeft, onMoveRight, enabled]);
}
