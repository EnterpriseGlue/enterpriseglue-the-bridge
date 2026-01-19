import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TenantPicker from '@src/components/TenantPicker';

vi.mock('@src/shared/api/client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@src/config', () => ({
  config: {
    multiTenant: false,
  },
}));

describe('TenantPicker', () => {
  it('renders nothing when multi-tenant disabled', () => {
    const { container } = render(
      <BrowserRouter>
        <TenantPicker />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});
