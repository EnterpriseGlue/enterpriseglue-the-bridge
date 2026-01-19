import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WrenchIcon } from '@src/features/mission-control/process-instance-detail/components/Icons';

describe('ProcessInstance Icons', () => {
  it('renders WrenchIcon svg', () => {
    const { container } = render(<WrenchIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
