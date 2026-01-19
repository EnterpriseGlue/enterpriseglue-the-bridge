import { describe, it, expect } from 'vitest';
import * as viewerTypes from '@src/features/shared/components/viewer/viewerTypes';

describe('viewerTypes', () => {
  it('loads viewer types module', () => {
    expect(viewerTypes).toBeDefined();
  });
});
