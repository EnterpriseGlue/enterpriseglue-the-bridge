import { describe, it, expect } from 'vitest';
import { buildProjectFileIndex, resolveLinkedFile, type ProjectFileMeta } from '@src/features/starbase/utils/linkResolution';

describe('linkResolution', () => {
  describe('buildProjectFileIndex', () => {
    it('builds index maps for ids and references', () => {
      const files: ProjectFileMeta[] = [
        { id: 'f1', name: 'Process A', type: 'bpmn', folderId: null, bpmnProcessId: 'p1' },
        { id: 'f2', name: 'Decision A', type: 'dmn', folderId: null, dmnDecisionId: 'd1' },
      ];

      const index = buildProjectFileIndex(files);

      expect(index.byId.get('f1')?.name).toBe('Process A');
      expect(index.byProcessId.get('p1')?.id).toBe('f1');
      expect(index.byDecisionId.get('d1')?.id).toBe('f2');
    });

    it('builds index for empty file list', () => {
      const index = buildProjectFileIndex([]);

      expect(index.byId.size).toBe(0);
      expect(index.byProcessId.size).toBe(0);
      expect(index.byDecisionId.size).toBe(0);
    });

    it('indexes BPMN files with process IDs', () => {
      const files: ProjectFileMeta[] = [
        { id: 'f1', name: 'Process A', type: 'bpmn', folderId: null, bpmnProcessId: 'p1' },
        { id: 'f2', name: 'Process B', type: 'bpmn', folderId: 'folder1', bpmnProcessId: 'p2' },
      ];

      const index = buildProjectFileIndex(files);

      expect(index.byId.size).toBe(2);
      expect(index.byProcessId.size).toBe(2);
      expect(index.byProcessId.get('p1')?.name).toBe('Process A');
      expect(index.byProcessId.get('p2')?.name).toBe('Process B');
    });

    it('indexes DMN files with decision IDs', () => {
      const files: ProjectFileMeta[] = [
        { id: 'f1', name: 'Decision A', type: 'dmn', folderId: null, dmnDecisionId: 'd1' },
        { id: 'f2', name: 'Decision B', type: 'dmn', folderId: 'folder1', dmnDecisionId: 'd2' },
      ];

      const index = buildProjectFileIndex(files);

      expect(index.byId.size).toBe(2);
      expect(index.byDecisionId.size).toBe(2);
      expect(index.byDecisionId.get('d1')?.name).toBe('Decision A');
      expect(index.byDecisionId.get('d2')?.name).toBe('Decision B');
    });

    it('does not index BPMN files without process IDs', () => {
      const files: ProjectFileMeta[] = [
        { id: 'f1', name: 'Process A', type: 'bpmn', folderId: null, bpmnProcessId: null },
        { id: 'f2', name: 'Process B', type: 'bpmn', folderId: null },
      ];

      const index = buildProjectFileIndex(files);

      expect(index.byId.size).toBe(2);
      expect(index.byProcessId.size).toBe(0);
    });

    it('does not index DMN files without decision IDs', () => {
      const files: ProjectFileMeta[] = [
        { id: 'f1', name: 'Decision A', type: 'dmn', folderId: null, dmnDecisionId: null },
        { id: 'f2', name: 'Decision B', type: 'dmn', folderId: null },
      ];

      const index = buildProjectFileIndex(files);

      expect(index.byId.size).toBe(2);
      expect(index.byDecisionId.size).toBe(0);
    });

    it('indexes form files by ID only', () => {
      const files: ProjectFileMeta[] = [
        { id: 'f1', name: 'Form A', type: 'form', folderId: null },
        { id: 'f2', name: 'Form B', type: 'form', folderId: 'folder1' },
      ];

      const index = buildProjectFileIndex(files);

      expect(index.byId.size).toBe(2);
      expect(index.byProcessId.size).toBe(0);
      expect(index.byDecisionId.size).toBe(0);
      expect(index.byId.get('f1')?.type).toBe('form');
    });

    it('indexes mixed file types', () => {
      const files: ProjectFileMeta[] = [
        { id: 'f1', name: 'Process A', type: 'bpmn', folderId: null, bpmnProcessId: 'p1' },
        { id: 'f2', name: 'Decision A', type: 'dmn', folderId: null, dmnDecisionId: 'd1' },
        { id: 'f3', name: 'Form A', type: 'form', folderId: null },
      ];

      const index = buildProjectFileIndex(files);

      expect(index.byId.size).toBe(3);
      expect(index.byProcessId.size).toBe(1);
      expect(index.byDecisionId.size).toBe(1);
    });

    it('handles files with isSelf flag', () => {
      const files: ProjectFileMeta[] = [
        { id: 'f1', name: 'Process A', type: 'bpmn', folderId: null, bpmnProcessId: 'p1', isSelf: true },
      ];

      const index = buildProjectFileIndex(files);

      expect(index.byId.get('f1')?.isSelf).toBe(true);
    });
  });

  describe('resolveLinkedFile', () => {
    const files: ProjectFileMeta[] = [
      { id: 'f1', name: 'Process A', type: 'bpmn', folderId: null, bpmnProcessId: 'p1' },
      { id: 'f2', name: 'Decision A', type: 'dmn', folderId: null, dmnDecisionId: 'd1' },
      { id: 'f3', name: 'Form A', type: 'form', folderId: null },
    ];

    it('resolves file by fileId', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { fileId: 'f2' });

      expect(result?.id).toBe('f2');
      expect(result?.name).toBe('Decision A');
    });

    it('resolves file by processId', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { processId: 'p1' });

      expect(result?.id).toBe('f1');
      expect(result?.name).toBe('Process A');
    });

    it('resolves file by decisionId', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { decisionId: 'd1' });

      expect(result?.id).toBe('f2');
      expect(result?.name).toBe('Decision A');
    });

    it('prioritizes fileId over processId', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { fileId: 'f2', processId: 'p1' });

      expect(result?.id).toBe('f2');
    });

    it('prioritizes fileId over decisionId', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { fileId: 'f1', decisionId: 'd1' });

      expect(result?.id).toBe('f1');
    });

    it('prioritizes processId over decisionId', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { processId: 'p1', decisionId: 'd1' });

      expect(result?.id).toBe('f1');
    });

    it('returns null when no match found', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { fileId: 'nonexistent' });

      expect(result).toBeNull();
    });

    it('returns null when all params are null', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { fileId: null, processId: null, decisionId: null });

      expect(result).toBeNull();
    });

    it('returns null when all params are undefined', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, {});

      expect(result).toBeNull();
    });

    it('returns null for non-existent processId', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { processId: 'nonexistent' });

      expect(result).toBeNull();
    });

    it('returns null for non-existent decisionId', () => {
      const index = buildProjectFileIndex(files);

      const result = resolveLinkedFile(index, { decisionId: 'nonexistent' });

      expect(result).toBeNull();
    });

    it('works with empty index', () => {
      const index = buildProjectFileIndex([]);

      const result = resolveLinkedFile(index, { fileId: 'f1' });

      expect(result).toBeNull();
    });
  });
});
