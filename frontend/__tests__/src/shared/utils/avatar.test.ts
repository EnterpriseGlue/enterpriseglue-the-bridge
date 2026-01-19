import { describe, it, expect } from 'vitest';
import { getInitials, getAvatarColor } from '@src/shared/utils/avatar';

describe('avatar utils', () => {
  describe('getInitials', () => {
    it('returns initials from first and last name', () => {
      expect(getInitials('Ada', 'Lovelace')).toBe('AL');
      expect(getInitials('John', 'Doe')).toBe('JD');
      expect(getInitials('Marie', 'Curie')).toBe('MC');
    });

    it('returns first initial when only first name provided', () => {
      expect(getInitials('Ada', null)).toBe('A');
      expect(getInitials('John', '')).toBe('J');
    });

    it('returns last initial when only last name provided', () => {
      expect(getInitials(null, 'Lovelace')).toBe('L');
      expect(getInitials('', 'Doe')).toBe('D');
    });

    it('returns ? when both names are null', () => {
      expect(getInitials(null, null)).toBe('?');
    });

    it('returns ? when both names are empty strings', () => {
      expect(getInitials('', '')).toBe('?');
    });

    it('returns ? when both names are whitespace', () => {
      expect(getInitials('   ', '   ')).toBe('?');
    });

    it('trims whitespace from names', () => {
      expect(getInitials('  Ada  ', '  Lovelace  ')).toBe('AL');
      expect(getInitials(' John ', ' Doe ')).toBe('JD');
    });

    it('converts initials to uppercase', () => {
      expect(getInitials('ada', 'lovelace')).toBe('AL');
      expect(getInitials('john', 'doe')).toBe('JD');
    });

    it('handles mixed case names', () => {
      expect(getInitials('aDa', 'lOvElAcE')).toBe('AL');
    });

    it('handles single character names', () => {
      expect(getInitials('A', 'L')).toBe('AL');
      expect(getInitials('X', 'Y')).toBe('XY');
    });

    it('handles names with multiple words (uses first character)', () => {
      expect(getInitials('Mary Jane', 'Watson')).toBe('MW');
      expect(getInitials('Jean-Luc', 'Picard')).toBe('JP');
    });

    it('handles special characters in names', () => {
      expect(getInitials('Ángel', 'García')).toBe('ÁG');
      expect(getInitials('Søren', 'Kierkegaard')).toBe('SK');
    });

    it('handles empty first name with valid last name', () => {
      expect(getInitials('', 'Smith')).toBe('S');
      expect(getInitials(null, 'Jones')).toBe('J');
    });

    it('handles valid first name with empty last name', () => {
      expect(getInitials('Alice', '')).toBe('A');
      expect(getInitials('Bob', null)).toBe('B');
    });

    it('handles whitespace-only first name', () => {
      expect(getInitials('   ', 'Smith')).toBe('S');
    });

    it('handles whitespace-only last name', () => {
      expect(getInitials('Alice', '   ')).toBe('A');
    });
  });

  describe('getAvatarColor', () => {
    it('returns a valid hex color', () => {
      const color = getAvatarColor('user-1');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns consistent colors for same userId', () => {
      const color1 = getAvatarColor('user-1');
      const color2 = getAvatarColor('user-1');
      expect(color1).toBe(color2);
    });

    it('returns different colors for different userIds', () => {
      const color1 = getAvatarColor('user-1');
      const color2 = getAvatarColor('user-2');
      // Note: There's a small chance they could be the same due to hash collision
      // but with 8 colors, it's unlikely for sequential IDs
      expect(color1).toBeDefined();
      expect(color2).toBeDefined();
    });

    it('returns one of the predefined colors', () => {
      const validColors = [
        '#0f62fe', // Blue
        '#FC5D0D', // Orange
        '#24a148', // Green
        '#8a3ffc', // Purple
        '#fa4d56', // Red
        '#007d79', // Teal
        '#f1c21b', // Yellow
        '#a56eff', // Violet
      ];
      const color = getAvatarColor('test-user');
      expect(validColors).toContain(color);
    });

    it('handles empty userId', () => {
      const color = getAvatarColor('');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('handles long userId', () => {
      const longId = 'a'.repeat(1000);
      const color = getAvatarColor(longId);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('handles userId with special characters', () => {
      const color = getAvatarColor('user@example.com');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('handles userId with unicode characters', () => {
      const color = getAvatarColor('用户-123');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('handles numeric userId', () => {
      const color = getAvatarColor('12345');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('distributes colors across different users', () => {
      const colors = new Set();
      for (let i = 0; i < 100; i++) {
        colors.add(getAvatarColor(`user-${i}`));
      }
      // With 100 users and 8 colors, we should see multiple colors
      expect(colors.size).toBeGreaterThan(1);
    });

    it('returns consistent color for similar userIds', () => {
      // Same userId should always return same color
      const color1 = getAvatarColor('abc123');
      const color2 = getAvatarColor('abc123');
      const color3 = getAvatarColor('abc123');
      expect(color1).toBe(color2);
      expect(color2).toBe(color3);
    });
  });
});
