import { describe, it, expect } from 'vitest';
import { buildActivityGroups, buildHistoryContext } from '@src/features/mission-control/process-instance-detail/components/activityDetailUtils';

describe('activityDetailUtils', () => {
  it('builds history context from grouped activity', () => {
    const context = buildHistoryContext({
      activityId: 'act-1',
      activityName: 'Task',
      totalExecCount: 2,
      statusLabel: 'ACTIVE',
      _summary: { startTs: 1000, endTs: 2000, durationMs: 1000 },
    });

    expect(context).toMatchObject({
      activityId: 'act-1',
      activityName: 'Task',
      executions: 2,
      statusLabel: 'ACTIVE',
    });
  });

  it('returns null history context when group is missing', () => {
    expect(buildHistoryContext(null)).toBeNull();
  });

  it('handles missing summary timestamps', () => {
    const context = buildHistoryContext({
      activityId: 'act-2',
      activityName: 'No Times',
      totalExecCount: 1,
      statusLabel: 'COMPLETED',
      _summary: { startTs: null, endTs: null, durationMs: null },
    });

    expect(context).toMatchObject({
      activityId: 'act-2',
      startTime: null,
      endTime: null,
      durationMs: null,
      executions: 1,
    });
  });

  it('groups activities and marks incident state', () => {
    const groups = buildActivityGroups({
      sortedActs: [{ activityId: 'act-1', activityName: 'Task', endTime: null }],
      incidentActivityIds: new Set(['act-1']),
      clickableActivityIds: new Set(['act-1']),
      selectedActivityId: 'act-1',
      execCounts: new Map([['act-1', 1]]),
    });

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      activityId: 'act-1',
      hasIncident: true,
      isClickable: true,
      isSelected: true,
    });
  });

  it('computes status labels for active and completed groups', () => {
    const groups = buildActivityGroups({
      sortedActs: [
        { activityId: 'active', activityName: 'Active', endTime: null, activityType: 'userTask' },
        { activityId: 'done', activityName: 'Done', endTime: '2024-01-01T00:00:00Z', activityType: 'userTask' },
      ],
      incidentActivityIds: new Set(),
      clickableActivityIds: new Set(),
      selectedActivityId: null,
      execCounts: new Map(),
    });

    const active = groups.find((g) => g.activityId === 'active');
    const done = groups.find((g) => g.activityId === 'done');

    expect(active?.statusLabel).toBe('ACTIVE');
    expect(done?.statusLabel).toBe('COMPLETED');
  });

  it('marks incident status when incidents exist', () => {
    const groups = buildActivityGroups({
      sortedActs: [{ activityId: 'act-1', activityName: 'Task', endTime: null }],
      incidentActivityIds: new Set(['act-1']),
      clickableActivityIds: new Set(),
      selectedActivityId: null,
      execCounts: new Map(),
    });

    expect(groups[0].statusLabel).toBe('INCIDENT');
    expect(groups[0].statusType).toBe('red');
  });

  it('uses execCounts override for totalExecCount', () => {
    const groups = buildActivityGroups({
      sortedActs: [{ activityId: 'act-1', activityName: 'Task', endTime: null }],
      incidentActivityIds: new Set(),
      clickableActivityIds: new Set(),
      selectedActivityId: null,
      execCounts: new Map([['act-1', 5]]),
    });

    expect(groups[0].totalExecCount).toBe(5);
  });

  it('falls back to instances length for totalExecCount', () => {
    const groups = buildActivityGroups({
      sortedActs: [
        { activityId: 'act-1', activityName: 'Task', endTime: null },
        { activityId: 'act-1', activityName: 'Task', endTime: null },
      ],
      incidentActivityIds: new Set(),
      clickableActivityIds: new Set(),
      selectedActivityId: null,
      execCounts: new Map(),
    });

    expect(groups[0].totalExecCount).toBe(2);
  });

  it('sets summary duration when timestamps are finite', () => {
    const groups = buildActivityGroups({
      sortedActs: [
        {
          activityId: 'act-1',
          activityName: 'Task',
          startTime: '2024-01-01T00:00:00Z',
          endTime: '2024-01-01T00:00:05Z',
        },
      ],
      incidentActivityIds: new Set(),
      clickableActivityIds: new Set(),
      selectedActivityId: null,
      execCounts: new Map(),
    });

    expect(groups[0]._summary.durationMs).toBeGreaterThan(0);
  });

  it('returns empty array when no activities', () => {
    const groups = buildActivityGroups({
      sortedActs: [],
      incidentActivityIds: new Set(),
      clickableActivityIds: new Set(),
      selectedActivityId: null,
      execCounts: new Map(),
    });

    expect(groups).toEqual([]);
  });
});
