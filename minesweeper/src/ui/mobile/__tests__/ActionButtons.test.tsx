import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionButtons } from '../ActionButtons';

describe('ActionButtons', () => {
  it('renders Dig, Flag, and Detonate buttons', () => {
    render(
      <ActionButtons onDig={() => {}} onFlag={() => {}} onDetonate={() => {}} />
    );

    expect(screen.getByRole('button', { name: 'Dig' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flag' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Detonate' })).toBeInTheDocument();
  });

  it('fires callbacks on pointer down', () => {
    const onDig = vi.fn();
    const onFlag = vi.fn();
    const onDetonate = vi.fn();

    render(<ActionButtons onDig={onDig} onFlag={onFlag} onDetonate={onDetonate} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Dig' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Flag' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Detonate' }));

    expect(onDig).toHaveBeenCalledTimes(1);
    expect(onFlag).toHaveBeenCalledTimes(1);
    expect(onDetonate).toHaveBeenCalledTimes(1);
  });
});
