import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import { FloorIndicator } from '../FloorIndicator';

describe('FloorIndicator', () => {
  it('正しいフロア番号とCP状況が表示されること', () => {
    render(
      <FloorIndicator
        floorNumber={2}
        totalCheckpoints={5}
        collectedCheckpoints={3}
      />
    );

    expect(screen.getByText(/Floor 2/)).toBeInTheDocument();
    expect(screen.getByText(/CP: 3 \/ 5/)).toBeInTheDocument();
  });

  it('初期状態（CPがない場合）でもエラーなく表示されること', () => {
    render(
      <FloorIndicator
        floorNumber={1}
        totalCheckpoints={0}
        collectedCheckpoints={0}
      />
    );

    expect(screen.getByText(/Floor 1/)).toBeInTheDocument();
    expect(screen.getByText(/CP: 0 \/ 0/)).toBeInTheDocument();
  });
});
