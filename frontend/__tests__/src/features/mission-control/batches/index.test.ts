import { describe, it, expect } from 'vitest';
import * as batchesModule from '@src/features/mission-control/batches/index';

describe('batches index', () => {
  it('exports batches page and components', () => {
    expect(batchesModule.BatchesPage).toBeDefined();
    expect(batchesModule.BatchesList).toBeDefined();
    expect(batchesModule.BatchDetail).toBeDefined();
    expect(batchesModule.BatchDetailModal).toBeDefined();
    expect(batchesModule.BatchOperationForm).toBeDefined();
    expect(batchesModule.NewDeleteBatch).toBeDefined();
    expect(batchesModule.NewSuspendBatch).toBeDefined();
    expect(batchesModule.NewActivateBatch).toBeDefined();
    expect(batchesModule.NewRetriesBatch).toBeDefined();
  });
});
