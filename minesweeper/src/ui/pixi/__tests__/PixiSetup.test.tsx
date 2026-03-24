import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PixiCanvas } from '../PixiCanvas';

vi.mock('@pixi/react', () => {
  interface MockStageProps {
    width?: number;
    height?: number;
    backgroundColor?: number;
    children?: ReactNode;
  }

  return {
    Application: ({ width, height, backgroundColor, children, ...rest }: MockStageProps) => (
      <div
        data-testid="mock-stage"
        data-width={width}
        data-height={height}
        data-background-color={backgroundColor}
        {...rest}
      >
        {children}
      </div>
    ),
  };
});

describe('Pixi setup', () => {
  it('mounts PixiCanvas without errors', () => {
    render(
      <PixiCanvas width={320} height={240}>
        <div data-testid="stage-child">child</div>
      </PixiCanvas>
    );

    expect(screen.getByTestId('mock-stage')).toBeInTheDocument();
    expect(screen.getByTestId('stage-child')).toBeInTheDocument();
  });

  it('passes Stage rendering props correctly', () => {
    render(<PixiCanvas width={640} height={480} />);

    const stage = screen.getByTestId('mock-stage');
    expect(stage).toHaveAttribute('data-width', '640');
    expect(stage).toHaveAttribute('data-height', '480');
    expect(stage).toHaveAttribute('data-background-color', '1710638');
  });
});
