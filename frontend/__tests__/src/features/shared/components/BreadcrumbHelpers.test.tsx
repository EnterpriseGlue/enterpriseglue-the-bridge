import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BreadcrumbLink, BreadcrumbText, BreadcrumbSeparator } from '@src/features/shared/components/BreadcrumbHelpers';

describe('BreadcrumbHelpers', () => {
  it('renders breadcrumb link', () => {
    render(
      <MemoryRouter>
        <BreadcrumbLink to="/test">Test Link</BreadcrumbLink>
      </MemoryRouter>
    );
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('renders breadcrumb text', () => {
    render(<BreadcrumbText>Text</BreadcrumbText>);
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('renders breadcrumb separator', () => {
    render(<BreadcrumbSeparator />);
    expect(screen.getByText('›')).toBeInTheDocument();
  });
});
