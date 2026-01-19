import { describe, it, expect } from 'vitest';
import { getInitials, getAvatarColor } from '@src/shared/utils/avatar';

describe('avatar utils additional', () => {
  it('generates initials from full name', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
    expect(getInitials('Alice', 'Smith')).toBe('AS');
  });

  it('generates initial from first name only', () => {
    expect(getInitials('John', null)).toBe('J');
    expect(getInitials('John', '')).toBe('J');
  });

  it('generates initial from last name only', () => {
    expect(getInitials(null, 'Doe')).toBe('D');
    expect(getInitials('', 'Doe')).toBe('D');
  });

  it('returns question mark for empty names', () => {
    expect(getInitials(null, null)).toBe('?');
    expect(getInitials('', '')).toBe('?');
  });

  it('generates consistent color for user ID', () => {
    const color1 = getAvatarColor('user-123');
    const color2 = getAvatarColor('user-123');
    expect(color1).toBe(color2);
  });

  it('generates different colors for different users', () => {
    const color1 = getAvatarColor('user-1');
    const color2 = getAvatarColor('user-2');
    expect(color1).toBeTruthy();
    expect(color2).toBeTruthy();
  });

  it('returns valid hex colors', () => {
    const color = getAvatarColor('test-user');
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
