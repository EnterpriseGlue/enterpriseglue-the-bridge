import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DiagramZoomControls from '@src/features/shared/components/DiagramZoomControls';

vi.mock('@carbon/react', () => ({
  Button: ({ iconDescription, onClick }: any) => (
    <button onClick={onClick}>{iconDescription}</button>
  ),
}));

vi.mock('@carbon/icons-react', () => ({
  FitToScreen: () => null,
  Add: () => null,
  Subtract: () => null,
  Maximize: () => null,
  Minimize: () => null,
}));

describe('DiagramZoomControls', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls viewerApi controls', () => {
    const viewerApi = {
      fitViewport: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      getContainerRef: () => ({ current: null }),
    };

    render(<DiagramZoomControls viewerApi={viewerApi} />);

    fireEvent.click(screen.getByText('Fit to screen'));
    fireEvent.click(screen.getByText('Zoom in'));
    fireEvent.click(screen.getByText('Zoom out'));

    expect(viewerApi.fitViewport).toHaveBeenCalled();
    expect(viewerApi.zoomIn).toHaveBeenCalled();
    expect(viewerApi.zoomOut).toHaveBeenCalled();
  });
});
