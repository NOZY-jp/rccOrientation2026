import '@testing-library/jest-dom';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VirtualJoystick } from '../VirtualJoystick';

type JoystickEvents = {
  move?: (evt: Event, data: { vector: { x: number; y: number } }) => void;
  end?: () => void;
};

const nippleMock = vi.hoisted(() => {
  const mockedEvents: JoystickEvents = {};

  const mockManager = {
    on: vi.fn((event: 'move' | 'end', handler: JoystickEvents['move'] | JoystickEvents['end']) => {
      if (event === 'move') {
        mockedEvents.move = handler as JoystickEvents['move'];
      }
      if (event === 'end') {
        mockedEvents.end = handler as JoystickEvents['end'];
      }
      return mockManager;
    }),
    destroy: vi.fn(),
  };

  const createMock = vi.fn(() => mockManager);

  return {
    mockedEvents,
    mockManager,
    createMock,
  };
});

vi.mock('nipplejs', () => ({
  default: {
    create: nippleMock.createMock,
  },
}));

describe('VirtualJoystick', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    nippleMock.mockedEvents.move = undefined;
    nippleMock.mockedEvents.end = undefined;
  });

  it('creates nipplejs manager with expected options', () => {
    const onDirectionChange = vi.fn();
    const onDirectionEnd = vi.fn();

    const { container } = render(
      <VirtualJoystick onDirectionChange={onDirectionChange} onDirectionEnd={onDirectionEnd} />
    );

    const zone = container.querySelector('.joystick-zone');
    expect(zone).not.toBeNull();
    expect(nippleMock.createMock).toHaveBeenCalledTimes(1);
    expect(nippleMock.createMock).toHaveBeenCalledWith({
      zone,
      mode: 'static',
      position: { left: '50%', bottom: '120px' },
      color: 'rgba(255, 255, 255, 0.3)',
      size: 100,
    });
    expect(nippleMock.mockManager.on).toHaveBeenCalledWith('move', expect.any(Function));
    expect(nippleMock.mockManager.on).toHaveBeenCalledWith('end', expect.any(Function));
  });

  it('forwards move and end events to callbacks', () => {
    const onDirectionChange = vi.fn();
    const onDirectionEnd = vi.fn();

    render(<VirtualJoystick onDirectionChange={onDirectionChange} onDirectionEnd={onDirectionEnd} />);

    nippleMock.mockedEvents.move?.(new Event('pointermove'), { vector: { x: 0.5, y: -0.25 } });
    nippleMock.mockedEvents.end?.();

    expect(onDirectionChange).toHaveBeenCalledWith(0.5, -0.25);
    expect(onDirectionEnd).toHaveBeenCalledTimes(1);
  });

  it('destroys manager on unmount', () => {
    const onDirectionChange = vi.fn();
    const onDirectionEnd = vi.fn();

    const { unmount } = render(
      <VirtualJoystick onDirectionChange={onDirectionChange} onDirectionEnd={onDirectionEnd} />
    );

    unmount();

    expect(nippleMock.mockManager.destroy).toHaveBeenCalledTimes(1);
  });
});
