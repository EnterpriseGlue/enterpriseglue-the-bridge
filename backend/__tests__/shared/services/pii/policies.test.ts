import { describe, expect, it } from 'vitest';
import { isValidEmail } from '@enterpriseglue/shared/domain/pii/policies.js';

describe('PII policies', () => {
  describe('isValidEmail', () => {
    it('accepts basic valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('first.last@example.co.uk')).toBe(true);
    });

    it('rejects malformed email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('missing-at.example.com')).toBe(false);
      expect(isValidEmail('user@localhost')).toBe(false);
      expect(isValidEmail('user@.example.com')).toBe(false);
      expect(isValidEmail('user@example.com ')).toBe(true);
    });

    it('handles pathological nested input without regex backtracking', () => {
      const pathological = `${'!@!.'.repeat(5000)}example.com`;
      expect(isValidEmail(pathological)).toBe(false);
    });
  });
});
