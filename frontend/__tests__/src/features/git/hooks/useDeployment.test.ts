import { describe, it, expect } from 'vitest';
import {
  useDeployment,
  useRollback,
  useDeployments,
  useCommitHistory,
} from '@src/features/git/hooks/useDeployment';

describe('useDeployment', () => {
  it('exports git deployment hooks', () => {
    expect(typeof useDeployment).toBe('function');
    expect(typeof useRollback).toBe('function');
    expect(typeof useDeployments).toBe('function');
    expect(typeof useCommitHistory).toBe('function');
  });
});
