import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDateTime,
  formatDate,
  formatRelativeTime,
  timestampToMs,
  msToTimestamp,
  now,
} from '@src/utils/dates';

describe('dates utils additional', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDateTime', () => {
    it('formats Unix timestamp', () => {
      const timestamp = 1705320000;
      const result = formatDateTime(timestamp);
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');
    });

    it('formats ISO string', () => {
      const isoString = '2024-01-15T10:00:00Z';
      const result = formatDateTime(isoString);
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');
    });

    it('returns dash for null', () => {
      expect(formatDateTime(null)).toBe('-');
      expect(formatDateTime(undefined)).toBe('-');
    });

    it('returns dash for invalid date', () => {
      expect(formatDateTime('invalid')).toBe('-');
    });
  });

  describe('formatDate', () => {
    it('formats Unix timestamp to date only', () => {
      const timestamp = 1705320000;
      const result = formatDate(timestamp);
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');
    });

    it('formats ISO string to date only', () => {
      const isoString = '2024-01-15T10:00:00Z';
      const result = formatDate(isoString);
      expect(result).toBeTruthy();
    });
  });

  describe('formatRelativeTime', () => {
    it('returns "just now" for recent timestamps', () => {
      const recentTimestamp = Math.floor(Date.now() / 1000) - 30;
      expect(formatRelativeTime(recentTimestamp)).toBe('just now');
    });

    it('returns minutes ago', () => {
      const minutesAgo = Math.floor(Date.now() / 1000) - 300;
      expect(formatRelativeTime(minutesAgo)).toBe('5 minutes ago');
    });

    it('returns hours ago', () => {
      const hoursAgo = Math.floor(Date.now() / 1000) - 7200;
      expect(formatRelativeTime(hoursAgo)).toBe('2 hours ago');
    });

    it('returns days ago', () => {
      const daysAgo = Math.floor(Date.now() / 1000) - 172800;
      expect(formatRelativeTime(daysAgo)).toBe('2 days ago');
    });

    it('returns formatted date for old timestamps', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 864000;
      const result = formatRelativeTime(oldTimestamp);
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');
    });
  });

  describe('timestamp conversions', () => {
    it('converts timestamp to milliseconds', () => {
      expect(timestampToMs(1705320000)).toBe(1705320000000);
    });

    it('converts milliseconds to timestamp', () => {
      expect(msToTimestamp(1705320000000)).toBe(1705320000);
    });

    it('gets current timestamp', () => {
      const currentTimestamp = now();
      expect(currentTimestamp).toBeGreaterThan(0);
      expect(currentTimestamp).toBe(Math.floor(Date.now() / 1000));
    });
  });
});
