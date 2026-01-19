import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProcessesSkeleton } from '@src/features/mission-control/processes-overview/components/ProcessesSkeleton';

describe('ProcessesSkeleton', () => {
  it('renders skeleton layout', () => {
    const { container } = render(<ProcessesSkeleton />);
    expect(container.querySelectorAll('.react-loading-skeleton').length).toBeGreaterThan(0);
  });
});
