import { describe, it, expect } from 'vitest';
import EmailTemplates from '@src/pages/admin/EmailTemplates';

describe('EmailTemplates', () => {
  it('exports EmailTemplates admin page component', () => {
    expect(EmailTemplates).toBeDefined();
    expect(typeof EmailTemplates).toBe('function');
  });
});
