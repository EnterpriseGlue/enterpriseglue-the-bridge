import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { InstanceDetailSkeleton } from '@src/features/mission-control/process-instance-detail/components/InstanceDetailSkeleton';

describe('InstanceDetailSkeleton', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<InstanceDetailSkeleton />);
    expect(container.querySelectorAll('.react-loading-skeleton').length).toBeGreaterThan(0);
  });
});
