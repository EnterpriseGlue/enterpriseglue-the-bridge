import { describe, it, expect } from 'vitest';
import invitationRouter from '../../../src/modules/invitations/index.js';

describe('invitations module index', () => {
  it('loads invitations router', () => {
    expect(invitationRouter).toBeDefined();
  });
});
