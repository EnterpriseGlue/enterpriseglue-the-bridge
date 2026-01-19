import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLayout, PageHeader, PAGE_GRADIENTS } from '@src/shared/components/PageLayout';

const FakeIcon = ({ size }: { size: number }) => <div>Icon {size}</div>;

describe('PageLayout', () => {
  it('renders children', () => {
    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('PageHeader', () => {
  it('renders title and subtitle', () => {
    render(
      <PageHeader
        icon={FakeIcon}
        title="Title"
        subtitle="Subtitle"
        gradient={PAGE_GRADIENTS.green}
      />
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });
});
