import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { FloorClearOverlay } from '../FloorClearOverlay';
import { RestPhaseScreen } from '../RestPhaseScreen';

describe('FloorTransitions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('FloorClearOverlay', () => {
    it('クリアしたフロア番号が表示されること', () => {
      render(<FloorClearOverlay floorNumber={3} onNext={() => {}} />);
      expect(screen.getByText('Floor 3 Clear!')).toBeInTheDocument();
    });

    it('2秒後にonNextが呼ばれること', () => {
      const onNextMock = vi.fn();
      render(<FloorClearOverlay floorNumber={1} onNext={onNextMock} />);
      
      expect(onNextMock).not.toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(onNextMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('RestPhaseScreen', () => {
    it('次のフロア番号と初期カウントダウンが表示されること', () => {
      render(<RestPhaseScreen nextFloorNumber={4} onTimeout={() => {}} />);
      
      expect(screen.getByText('Next Floor: 4')).toBeInTheDocument();
      expect(screen.getByText('Starting in 3...')).toBeInTheDocument();
    });

    it('1秒ごとにカウントダウンが減り、3秒後にonTimeoutが呼ばれること', () => {
      const onTimeoutMock = vi.fn();
      render(<RestPhaseScreen nextFloorNumber={2} onTimeout={onTimeoutMock} />);
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('Starting in 2...')).toBeInTheDocument();
      expect(onTimeoutMock).not.toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('Starting in 1...')).toBeInTheDocument();
      expect(onTimeoutMock).not.toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      
      expect(onTimeoutMock).toHaveBeenCalledTimes(1);
    });
  });
});
