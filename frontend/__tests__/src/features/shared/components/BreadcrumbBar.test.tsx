import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BreadcrumbBar } from '@src/features/shared/components/BreadcrumbBar';

describe('BreadcrumbBar', () => {
  it('renders children within breadcrumb container', () => {
    render(
      <BreadcrumbBar>
        <span>Home</span>
        <span>Projects</span>
      </BreadcrumbBar>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('filters out invalid children', () => {
    render(
      <BreadcrumbBar>
        <span>Valid</span>
        {null}
        {undefined}
        <span>Also Valid</span>
      </BreadcrumbBar>
    );

    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Also Valid')).toBeInTheDocument();
  });
});
