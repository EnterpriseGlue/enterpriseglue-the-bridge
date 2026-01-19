import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '@src/shared/components/LoadingState';

vi.mock('@carbon/react', () => ({
  SkeletonIcon: () => <div>SkeletonIcon</div>,
  SkeletonText: ({ heading }: { heading?: boolean }) => (
    <div>{heading ? 'SkeletonHeading' : 'SkeletonText'}</div>
  ),
}));

describe('LoadingState', () => {
  it('renders skeleton content', () => {
    render(<LoadingState />);
    expect(screen.getByText('SkeletonIcon')).toBeInTheDocument();
    expect(screen.getByText('SkeletonHeading')).toBeInTheDocument();
  });
});
