import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ErrorBoundary } from '@src/shared/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error message');
};

describe('ErrorBoundary fallback', () => {
  it('renders fallback UI when error occurs', () => {
    const consoleError = console.error;
    console.error = () => {};

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    console.error = consoleError;
  });
});
