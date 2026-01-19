import { describe, it, expect } from 'vitest';
import * as invitationSchemas from '../../../src/modules/invitations/schemas/index.js';

describe('invitations schemas index', () => {
  it('loads invitations schemas module', () => {
    expect(invitationSchemas).toBeDefined();
  });
});
