import { describe, it, expect, beforeEach } from 'vitest';
import { toSafeInternalPath, toSafeExternalUrl, toSafePathSegment } from '@src/utils/safeNavigation';

describe('safeNavigation utils', () => {
  beforeEach(() => {
    // Reset window.location for each test
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  describe('toSafeInternalPath', () => {
    it('allows valid internal paths', () => {
      expect(toSafeInternalPath('/dashboard', '/fallback')).toBe('/dashboard');
      expect(toSafeInternalPath('/users/123', '/fallback')).toBe('/users/123');
    });

    it('preserves query strings and hashes', () => {
      expect(toSafeInternalPath('/page?foo=bar', '/fallback')).toBe('/page?foo=bar');
      expect(toSafeInternalPath('/page#section', '/fallback')).toBe('/page#section');
      expect(toSafeInternalPath('/page?foo=bar#section', '/fallback')).toBe('/page?foo=bar#section');
    });

    it('rejects external URLs', () => {
      expect(toSafeInternalPath('https://evil.com', '/fallback')).toBe('/fallback');
      expect(toSafeInternalPath('http://evil.com/path', '/fallback')).toBe('/fallback');
    });

    it('rejects protocol-relative URLs', () => {
      expect(toSafeInternalPath('//evil.com', '/fallback')).toBe('/fallback');
      expect(toSafeInternalPath('//evil.com/path', '/fallback')).toBe('/fallback');
    });

    it('rejects paths not starting with /', () => {
      expect(toSafeInternalPath('dashboard', '/fallback')).toBe('/fallback');
      expect(toSafeInternalPath('relative/path', '/fallback')).toBe('/fallback');
    });

    it('rejects non-string values', () => {
      expect(toSafeInternalPath(null, '/fallback')).toBe('/fallback');
      expect(toSafeInternalPath(undefined, '/fallback')).toBe('/fallback');
      expect(toSafeInternalPath(123, '/fallback')).toBe('/fallback');
      expect(toSafeInternalPath({}, '/fallback')).toBe('/fallback');
    });

    it('rejects empty strings', () => {
      expect(toSafeInternalPath('', '/fallback')).toBe('/fallback');
      expect(toSafeInternalPath('   ', '/fallback')).toBe('/fallback');
    });

    it('handles invalid URLs gracefully', () => {
      expect(toSafeInternalPath('/valid', '/fallback')).toBe('/valid');
    });

    it('trims whitespace', () => {
      expect(toSafeInternalPath('  /dashboard  ', '/fallback')).toBe('/dashboard');
    });
  });

  describe('toSafePathSegment', () => {
    it('allows valid alphanumeric segments', () => {
      expect(toSafePathSegment('tenant-1')).toBe('tenant-1');
      expect(toSafePathSegment('user_123')).toBe('user_123');
      expect(toSafePathSegment('abc123')).toBe('abc123');
      expect(toSafePathSegment('ABC-DEF_123')).toBe('ABC-DEF_123');
    });

    it('rejects segments with invalid characters', () => {
      expect(toSafePathSegment('bad/segment')).toBeNull();
      expect(toSafePathSegment('bad\\segment')).toBeNull();
      expect(toSafePathSegment('bad segment')).toBeNull();
      expect(toSafePathSegment('bad.segment')).toBeNull();
      expect(toSafePathSegment('bad@segment')).toBeNull();
      expect(toSafePathSegment('bad#segment')).toBeNull();
    });

    it('rejects non-string values', () => {
      expect(toSafePathSegment(null)).toBeNull();
      expect(toSafePathSegment(undefined)).toBeNull();
      expect(toSafePathSegment(123)).toBeNull();
      expect(toSafePathSegment({})).toBeNull();
    });

    it('rejects empty strings', () => {
      expect(toSafePathSegment('')).toBeNull();
      expect(toSafePathSegment('   ')).toBeNull();
    });

    it('trims whitespace', () => {
      expect(toSafePathSegment('  valid-123  ')).toBe('valid-123');
    });
  });

  describe('toSafeExternalUrl', () => {
    it('allows https URLs by default', () => {
      expect(toSafeExternalUrl('https://example.com')).toBe('https://example.com/');
      expect(toSafeExternalUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('allows http URLs by default', () => {
      expect(toSafeExternalUrl('http://example.com')).toBe('http://example.com/');
    });

    it('rejects non-http(s) protocols by default', () => {
      expect(toSafeExternalUrl('ftp://example.com')).toBeNull();
      expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
      expect(toSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(toSafeExternalUrl('file:///etc/passwd')).toBeNull();
    });

    it('respects custom allowed protocols', () => {
      expect(toSafeExternalUrl('ftp://example.com', { allowedProtocols: ['ftp:'] })).toBe('ftp://example.com/');
      expect(toSafeExternalUrl('https://example.com', { allowedProtocols: ['ftp:'] })).toBeNull();
    });

    it('validates against allowed hosts', () => {
      expect(toSafeExternalUrl('https://example.com', { allowedHosts: ['example.com'] })).toBe('https://example.com/');
      expect(toSafeExternalUrl('https://evil.com', { allowedHosts: ['example.com'] })).toBeNull();
    });

    it('allows subdomains when allowSubdomains is true', () => {
      expect(toSafeExternalUrl('https://sub.example.com', { 
        allowedHosts: ['example.com'], 
        allowSubdomains: true 
      })).toBe('https://sub.example.com/');
      
      expect(toSafeExternalUrl('https://deep.sub.example.com', { 
        allowedHosts: ['example.com'], 
        allowSubdomains: true 
      })).toBe('https://deep.sub.example.com/');
    });

    it('rejects subdomains when allowSubdomains is false', () => {
      expect(toSafeExternalUrl('https://sub.example.com', { 
        allowedHosts: ['example.com'], 
        allowSubdomains: false 
      })).toBeNull();
    });

    it('handles case-insensitive hostname matching', () => {
      expect(toSafeExternalUrl('https://EXAMPLE.COM', { 
        allowedHosts: ['example.com'] 
      })).toBe('https://example.com/');
      
      expect(toSafeExternalUrl('https://example.com', { 
        allowedHosts: ['EXAMPLE.COM'] 
      })).toBe('https://example.com/');
    });

    it('handles empty allowed hosts array', () => {
      expect(toSafeExternalUrl('https://example.com', { allowedHosts: [] })).toBe('https://example.com/');
    });

    it('handles undefined allowed hosts', () => {
      expect(toSafeExternalUrl('https://example.com', {})).toBe('https://example.com/');
    });

    it('rejects non-string values', () => {
      expect(toSafeExternalUrl(null)).toBeNull();
      expect(toSafeExternalUrl(undefined)).toBeNull();
      expect(toSafeExternalUrl(123)).toBeNull();
      expect(toSafeExternalUrl({})).toBeNull();
    });

    it('rejects invalid URLs', () => {
      expect(toSafeExternalUrl('not a url')).toBeNull();
      expect(toSafeExternalUrl('://invalid')).toBeNull();
    });

    it('handles empty strings in allowed hosts', () => {
      expect(toSafeExternalUrl('https://example.com', { 
        allowedHosts: ['', 'example.com', ''] 
      })).toBe('https://example.com/');
    });

    it('trims allowed hosts', () => {
      expect(toSafeExternalUrl('https://example.com', { 
        allowedHosts: ['  example.com  '] 
      })).toBe('https://example.com/');
    });
  });
});
