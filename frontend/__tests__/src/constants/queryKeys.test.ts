import { describe, it, expect } from 'vitest';
import { queryKeys } from '@src/constants/queryKeys';

describe('queryKeys', () => {
  it('generates starbase project keys', () => {
    expect(queryKeys.starbase.projects()).toEqual(['starbase', 'projects']);
    expect(queryKeys.starbase.project('proj-1')).toEqual(['starbase', 'project', 'proj-1']);
  });

  it('generates file keys', () => {
    expect(queryKeys.starbase.file('file-1')).toEqual(['file', 'file-1']);
    expect(queryKeys.starbase.versions('file-1')).toEqual(['versions', 'file-1']);
  });

  it('generates git keys', () => {
    expect(queryKeys.git.providers()).toEqual(['git', 'providers']);
    expect(queryKeys.git.repository('proj-1')).toEqual(['git', 'repository', 'proj-1']);
  });

  it('generates mission control keys', () => {
    expect(queryKeys.missionControl.processes('eng-1')).toEqual(['processes', 'eng-1', undefined]);
    expect(queryKeys.missionControl.instance('inst-1')).toEqual(['instance', 'inst-1']);
  });

  it('generates engine keys', () => {
    expect(queryKeys.engines.list()).toEqual(['engines']);
    expect(queryKeys.engines.members('eng-1')).toEqual(['engine-members', 'eng-1']);
  });

  it('generates contents keys with folder', () => {
    expect(queryKeys.starbase.contents('proj-1', 'folder-1')).toEqual(['contents', 'proj-1', 'folder-1']);
    expect(queryKeys.starbase.contents('proj-1', null)).toEqual(['contents', 'proj-1', null]);
  });
});
