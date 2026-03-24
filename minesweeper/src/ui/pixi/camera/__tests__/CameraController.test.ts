import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, ZOOM_SPEED } from '../camera.constants';
import { useCamera } from '../useCamera';

describe('Camera controller', () => {
  it('starts with provided initial position and default zoom', () => {
    const { result } = renderHook(() => useCamera(12, 24));

    expect(result.current.camera).toEqual({ x: 12, y: 24, zoom: DEFAULT_ZOOM });
  });

  it('clamps zoom in configured range on wheel input', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.handleWheel(-100);
      result.current.handleWheel(-100);
    });

    expect(result.current.camera.zoom).toBeCloseTo(DEFAULT_ZOOM + ZOOM_SPEED * 2, 8);

    act(() => {
      for (let step = 0; step < 100; step += 1) {
        result.current.handleWheel(100);
      }
    });

    expect(result.current.camera.zoom).toBe(MIN_ZOOM);

    act(() => {
      for (let step = 0; step < 200; step += 1) {
        result.current.handleWheel(-100);
      }
    });

    expect(result.current.camera.zoom).toBe(MAX_ZOOM);
  });

  it('moves only while panning is active', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.handlePanMove(5, 7);
    });

    expect(result.current.camera).toEqual({ x: 0, y: 0, zoom: DEFAULT_ZOOM });

    act(() => {
      result.current.handlePanStart();
    });

    act(() => {
      result.current.handlePanMove(5, 7);
    });

    expect(result.current.camera.x).toBe(5);
    expect(result.current.camera.y).toBe(7);

    act(() => {
      result.current.handlePanEnd();
    });

    act(() => {
      result.current.handlePanMove(10, 10);
    });

    expect(result.current.camera.x).toBe(5);
    expect(result.current.camera.y).toBe(7);
  });

  it('resets camera to centered board placement', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.resetCamera(320, 320, 600, 400);
    });

    expect(result.current.camera).toEqual({
      x: 140,
      y: 40,
      zoom: DEFAULT_ZOOM,
    });
  });
});
