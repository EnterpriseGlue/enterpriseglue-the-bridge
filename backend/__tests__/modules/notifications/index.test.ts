import { describe, it, expect } from 'vitest';
import * as notificationsModule from '../../../src/modules/notifications/index.js';

describe('notifications module index', () => {
  it('exports notifications route', () => {
    expect(notificationsModule).toHaveProperty('notificationsRoute');
  });
});
