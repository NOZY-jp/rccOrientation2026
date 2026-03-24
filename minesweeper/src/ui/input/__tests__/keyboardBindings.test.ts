import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KEY_BINDINGS } from '../keyboardBindings';
import { useCursor } from '../useCursor';
import { useKeyboardInput } from '../useKeyboardInput';

describe('keyboard bindings', () => {
  it('exposes expected key codes', () => {
    expect(KEY_BINDINGS).toEqual({
      dig: 'KeyJ',
      flag: 'KeyK',
      detonate: 'Space',
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    });
  });
});

describe('useCursor', () => {
  it('starts at provided initial position', () => {
    const { result } = renderHook(() => useCursor(4, 4));

    expect(result.current.cursor).toEqual({ x: 4, y: 4 });
  });

  it('moves within board bounds and clamps at edges', () => {
    const { result } = renderHook(() => useCursor(1, 1));

    act(() => {
      result.current.moveCursor(1, 0, 3, 3);
    });
    expect(result.current.cursor).toEqual({ x: 2, y: 1 });

    act(() => {
      result.current.moveCursor(5, 5, 3, 3);
    });
    expect(result.current.cursor).toEqual({ x: 2, y: 2 });

    act(() => {
      result.current.moveCursor(-10, -10, 3, 3);
    });
    expect(result.current.cursor).toEqual({ x: 0, y: 0 });
  });
});

describe('useKeyboardInput', () => {
  const onDig = vi.fn();
  const onFlag = vi.fn();
  const onDetonate = vi.fn();
  const onMoveUp = vi.fn();
  const onMoveDown = vi.fn();
  const onMoveLeft = vi.fn();
  const onMoveRight = vi.fn();

  const setup = (enabled = true) =>
    renderHook(() =>
      useKeyboardInput({
        onDig,
        onFlag,
        onDetonate,
        onMoveUp,
        onMoveDown,
        onMoveLeft,
        onMoveRight,
        enabled,
      })
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers and unregisters keydown listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = setup();

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('calls action handlers for configured keys', () => {
    setup();

    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY_BINDINGS.dig }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY_BINDINGS.flag }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY_BINDINGS.detonate }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY_BINDINGS.up }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY_BINDINGS.down }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY_BINDINGS.left }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY_BINDINGS.right }));

    expect(onDig).toHaveBeenCalledTimes(1);
    expect(onFlag).toHaveBeenCalledTimes(1);
    expect(onDetonate).toHaveBeenCalledTimes(1);
    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
    expect(onMoveLeft).toHaveBeenCalledTimes(1);
    expect(onMoveRight).toHaveBeenCalledTimes(1);
  });

  it('ignores WASD keys in D2', () => {
    setup();

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));

    expect(onDig).not.toHaveBeenCalled();
    expect(onFlag).not.toHaveBeenCalled();
    expect(onDetonate).not.toHaveBeenCalled();
    expect(onMoveUp).not.toHaveBeenCalled();
    expect(onMoveDown).not.toHaveBeenCalled();
    expect(onMoveLeft).not.toHaveBeenCalled();
    expect(onMoveRight).not.toHaveBeenCalled();
  });

  it('ignores repeated keydown events', () => {
    setup();

    window.dispatchEvent(new KeyboardEvent('keydown', { code: KEY_BINDINGS.dig, repeat: true }));

    expect(onDig).not.toHaveBeenCalled();
  });

  it('does not register listeners when disabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    setup(false);

    expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
    addSpy.mockRestore();
  });
});
