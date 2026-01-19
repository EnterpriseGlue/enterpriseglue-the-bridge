import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GitProviderIcon } from '@src/features/shared/components/GitProviderIcon';

describe('GitProviderIcon', () => {
  it('renders GitHub icon for github type', () => {
    const { container } = render(<GitProviderIcon type="github" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders GitLab icon for gitlab type', () => {
    const { container } = render(<GitProviderIcon type="gitlab" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders Bitbucket icon for bitbucket type', () => {
    const { container } = render(<GitProviderIcon type="bitbucket" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders Azure DevOps icon for azure-devops type', () => {
    const { container } = render(<GitProviderIcon type="azure-devops" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders default Branch icon for unknown type', () => {
    const { container } = render(<GitProviderIcon type="unknown" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    const { container } = render(<GitProviderIcon type="github" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
  });
});
