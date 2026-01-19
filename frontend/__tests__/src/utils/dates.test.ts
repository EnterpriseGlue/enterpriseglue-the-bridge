import { describe, it, expect, vi } from 'vitest';
import { formatDateTime, formatDate, formatRelativeTime, timestampToMs, msToTimestamp, now } from '@src/utils/dates';

describe('date utils', () => {
  it('formats dates safely', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDate('invalid')).toBe('-');
  });

  it('formats unix timestamps and ISO strings', () => {
    const base = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(base);
    const seconds = Math.floor(base / 1000);
    expect(formatDateTime(seconds)).toContain('2023');
    expect(formatDate(seconds)).toContain('2023');
    expect(formatDateTime('2024-01-01T10:00:00Z')).toContain('2024');
    vi.restoreAllMocks();
  });

  it('formats relative time', () => {
    const base = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(base);
    const secondsAgo = Math.floor((base - 30_000) / 1000);
    expect(formatRelativeTime(secondsAgo)).toBe('just now');
    const minutesAgo = Math.floor((base - 5 * 60 * 1000) / 1000);
    expect(formatRelativeTime(minutesAgo)).toBe('5 minutes ago');
    const hoursAgo = Math.floor((base - 2 * 60 * 60 * 1000) / 1000);
    expect(formatRelativeTime(hoursAgo)).toBe('2 hours ago');
    const daysAgo = Math.floor((base - 3 * 24 * 60 * 60 * 1000) / 1000);
    expect(formatRelativeTime(daysAgo)).toBe('3 days ago');
    vi.restoreAllMocks();
  });

  it('falls back to formatted date for older values', () => {
    const base = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(base);
    const daysAgo = Math.floor((base - 10 * 24 * 60 * 60 * 1000) / 1000);
    const formatted = formatRelativeTime(daysAgo);
    expect(formatted).toContain('2023');
    vi.restoreAllMocks();
  });

  it('converts timestamps', () => {
    expect(timestampToMs(10)).toBe(10_000);
    expect(msToTimestamp(10_000)).toBe(10);
  });

  it('returns now in seconds', () => {
    const base = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(base);
    expect(now()).toBe(Math.floor(base / 1000));
    vi.restoreAllMocks();
  });
});
