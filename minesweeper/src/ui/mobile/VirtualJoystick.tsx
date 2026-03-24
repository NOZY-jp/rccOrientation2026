import nipplejs from 'nipplejs';
import { useEffect, useRef } from 'react';

interface VirtualJoystickProps {
  onDirectionChange: (x: number, y: number) => void;
  onDirectionEnd: () => void;
}

interface JoystickVectorData {
  vector?: {
    x: number;
    y: number;
  };
}

interface JoystickManagerLike {
  on: (
    event: 'move' | 'end',
    handler: ((_evt: Event, data?: JoystickVectorData) => void) | (() => void)
  ) => void;
  destroy: () => void;
}

export function VirtualJoystick({ onDirectionChange, onDirectionEnd }: VirtualJoystickProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<JoystickManagerLike | null>(null);

  useEffect(() => {
    if (zoneRef.current === null) {
      return;
    }

    const manager = nipplejs.create({
      zone: zoneRef.current,
      mode: 'static',
      position: { left: '50%', bottom: '120px' },
      color: 'rgba(255, 255, 255, 0.3)',
      size: 100,
    }) as unknown as JoystickManagerLike;

    managerRef.current = manager;

    manager.on('move', (_evt, data) => {
      if (data === undefined || data.vector === undefined) {
        return;
      }

      const { x, y } = data.vector;
      onDirectionChange(x, y);
    });

    manager.on('end', () => {
      onDirectionEnd();
    });

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [onDirectionChange, onDirectionEnd]);

  return <div ref={zoneRef} className="joystick-zone" />;
}
