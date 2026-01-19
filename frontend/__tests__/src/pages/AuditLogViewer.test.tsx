import { describe, it, expect } from 'vitest';
import AuditLogViewer from '@src/pages/AuditLogViewer';

describe('AuditLogViewer', () => {
  it('exports AuditLogViewer page component', () => {
    expect(AuditLogViewer).toBeDefined();
    expect(typeof AuditLogViewer).toBe('function');
  });
});
