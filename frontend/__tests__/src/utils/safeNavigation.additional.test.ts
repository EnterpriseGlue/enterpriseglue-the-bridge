import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toSafeInternalPath, toSafePathSegment, toSafeExternalUrl } from '@src/utils/safeNavigation';

describe('safeNavigation utils additional', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete (window as any).location;
    window.location = { origin: 'https://example.com' } as any;
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  describe('toSafeInternalPath', () => {
    it('returns valid internal paths', () => {
      expect(toSafeInternalPath('/dashboard', '/')).toBe('/dashboard');
      expect(toSafeInternalPath('/projects?id=1', '/')).toBe('/projects?id=1');
    });

    it('rejects non-string values', () => {
      expect(toSafeInternalPath(123, '/')).toBe('/');
      expect(toSafeInternalPath(null, '/')).toBe('/');
    });

    it('rejects paths not starting with /', () => {
      expect(toSafeInternalPath('dashboard', '/')).toBe('/');
    });

    it('rejects protocol-relative URLs', () => {
      expect(toSafeInternalPath('//evil.com/path', '/')).toBe('/');
    });
  });

  describe('toSafePathSegment', () => {
    it('accepts valid path segments', () => {
      expect(toSafePathSegment('project-123')).toBe('project-123');
      expect(toSafePathSegment('user_456')).toBe('user_456');
    });

    it('rejects invalid characters', () => {
      expect(toSafePathSegment('path/with/slash')).toBeNull();
      expect(toSafePathSegment('../relative')).toBeNull();
    });

    it('rejects non-string values', () => {
      expect(toSafePathSegment(123)).toBeNull();
      expect(toSafePathSegment(null)).toBeNull();
    });

    it('rejects empty strings', () => {
      expect(toSafePathSegment('')).toBeNull();
      expect(toSafePathSegment('   ')).toBeNull();
    });
  });

  describe('toSafeExternalUrl', () => {
    it('accepts valid HTTPS URLs', () => {
      const url = toSafeExternalUrl('https://example.com/path');
      expect(url).toBe('https://example.com/path');
    });

    it('rejects invalid protocols', () => {
      expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
      expect(toSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('filters by allowed hosts', () => {
      const url = toSafeExternalUrl('https://example.com/path', {
        allowedHosts: ['example.com'],
      });
      expect(url).toBe('https://example.com/path');

      expect(toSafeExternalUrl('https://evil.com/path', {
        allowedHosts: ['example.com'],
      })).toBeNull();
    });

    it('allows subdomains when configured', () => {
      const url = toSafeExternalUrl('https://sub.example.com/path', {
        allowedHosts: ['example.com'],
        allowSubdomains: true,
      });
      expect(url).toBe('https://sub.example.com/path');
    });

    it('rejects non-string values', () => {
      expect(toSafeExternalUrl(123)).toBeNull();
      expect(toSafeExternalUrl(null)).toBeNull();
    });
  });
});
