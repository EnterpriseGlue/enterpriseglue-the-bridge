import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useXmlHistory } from '@src/features/starbase/hooks/useXmlHistory';

describe('useXmlHistory', () => {
  const mockXml1 = '<bpmn>test1</bpmn>';
  const mockXml2 = '<bpmn>test2</bpmn>';
  const mockXml3 = '<bpmn>test3</bpmn>';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('initializes with empty history when no fileId', () => {
      const { result } = renderHook(() => useXmlHistory(undefined));

      expect(result.current.snapshots).toEqual([]);
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('initializes with empty history for new file', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      expect(result.current.snapshots).toEqual([]);
      expect(result.current.currentIndex).toBe(-1);
    });

    it('loads existing history from localStorage', () => {
      const existingHistory = {
        snapshots: [
          { xml: mockXml1, timestamp: Date.now(), label: 'Initial' },
        ],
        currentIndex: 0,
      };
      localStorage.setItem('xml-history-file-1', JSON.stringify(existingHistory));

      const { result } = renderHook(() => useXmlHistory('file-1'));

      expect(result.current.snapshots).toHaveLength(1);
      expect(result.current.snapshots[0].xml).toBe(mockXml1);
      expect(result.current.currentIndex).toBe(0);
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('xml-history-file-1', 'invalid json');

      const { result } = renderHook(() => useXmlHistory('file-1'));

      expect(result.current.snapshots).toEqual([]);
      expect(result.current.currentIndex).toBe(-1);
    });

    it('handles incomplete localStorage data', () => {
      localStorage.setItem('xml-history-file-1', JSON.stringify({ snapshots: [] }));

      const { result } = renderHook(() => useXmlHistory('file-1'));

      expect(result.current.snapshots).toEqual([]);
      expect(result.current.currentIndex).toBe(-1);
    });
  });

  describe('initializeWithXml', () => {
    it('initializes history with initial XML', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.initializeWithXml(mockXml1);
      });

      expect(result.current.snapshots).toHaveLength(1);
      expect(result.current.snapshots[0].xml).toBe(mockXml1);
      expect(result.current.snapshots[0].label).toBe('Initial state');
      expect(result.current.currentIndex).toBe(0);
    });

    it('does not reinitialize if history already exists', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.initializeWithXml(mockXml1);
      });

      const firstSnapshotTime = result.current.snapshots[0].timestamp;

      act(() => {
        result.current.initializeWithXml(mockXml2);
      });

      expect(result.current.snapshots).toHaveLength(1);
      expect(result.current.snapshots[0].xml).toBe(mockXml1);
      expect(result.current.snapshots[0].timestamp).toBe(firstSnapshotTime);
    });
  });

  describe('addSnapshot', () => {
    it('adds a new snapshot', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First change');
      });

      expect(result.current.snapshots).toHaveLength(1);
      expect(result.current.snapshots[0].xml).toBe(mockXml1);
      expect(result.current.snapshots[0].label).toBe('First change');
      expect(result.current.currentIndex).toBe(0);
    });

    it('uses default label when not provided', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1);
      });

      expect(result.current.snapshots[0].label).toBe('Change');
    });

    it('skips adding duplicate XML', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
      });

      act(() => {
        result.current.addSnapshot(mockXml1, 'Duplicate');
      });

      expect(result.current.snapshots).toHaveLength(1);
    });

    it('truncates future snapshots when adding after undo', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
        result.current.addSnapshot(mockXml2, 'Second');
        result.current.addSnapshot(mockXml3, 'Third');
      });

      expect(result.current.snapshots).toHaveLength(3);

      act(() => {
        result.current.undo();
      });

      expect(result.current.currentIndex).toBe(1);

      act(() => {
        result.current.addSnapshot('<bpmn>new</bpmn>', 'New branch');
      });

      expect(result.current.snapshots).toHaveLength(3);
      expect(result.current.snapshots[2].xml).toBe('<bpmn>new</bpmn>');
      expect(result.current.currentIndex).toBe(2);
    });

    it('limits history to MAX_HISTORY snapshots', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        for (let i = 0; i < 55; i++) {
          result.current.addSnapshot(`<bpmn>test${i}</bpmn>`, `Change ${i}`);
        }
      });

      expect(result.current.snapshots.length).toBeLessThanOrEqual(50);
      expect(result.current.currentIndex).toBe(result.current.snapshots.length - 1);
    });

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
      });

      const stored = localStorage.getItem('xml-history-file-1');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.snapshots).toHaveLength(1);
      expect(parsed.snapshots[0].xml).toBe(mockXml1);
    });
  });

  describe('undo/redo', () => {
    it('undoes to previous snapshot', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
        result.current.addSnapshot(mockXml2, 'Second');
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.canUndo).toBe(true);

      let undoneXml: string | null = null;
      act(() => {
        undoneXml = result.current.undo();
      });

      expect(undoneXml).toBe(mockXml1);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('returns null when cannot undo', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
      });

      act(() => {
        result.current.undo();
      });

      let undoneXml: string | null = null;
      act(() => {
        undoneXml = result.current.undo();
      });

      expect(undoneXml).toBeNull();
    });

    it('redoes to next snapshot', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
      });

      act(() => {
        result.current.addSnapshot(mockXml2, 'Second');
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canRedo).toBe(true);

      let redoneXml: string | null = null;
      act(() => {
        redoneXml = result.current.redo();
      });

      expect(redoneXml).toBe(mockXml2);
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.canRedo).toBe(false);
    });

    it('returns null when cannot redo', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
      });

      let redoneXml: string | null = null;
      act(() => {
        redoneXml = result.current.redo();
      });

      expect(redoneXml).toBeNull();
    });
  });

  describe('goToSnapshot', () => {
    it('goes to specific snapshot by index', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
        result.current.addSnapshot(mockXml2, 'Second');
        result.current.addSnapshot(mockXml3, 'Third');
      });

      let xml: string | null = null;
      act(() => {
        xml = result.current.goToSnapshot(1);
      });

      expect(xml).toBe(mockXml2);
      expect(result.current.currentIndex).toBe(1);
    });

    it('returns null for invalid index', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
      });

      let xml: string | null = null;
      act(() => {
        xml = result.current.goToSnapshot(5);
      });

      expect(xml).toBeNull();

      act(() => {
        xml = result.current.goToSnapshot(-1);
      });

      expect(xml).toBeNull();
    });
  });

  describe('clearHistory', () => {
    it('clears all history and localStorage', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
        result.current.addSnapshot(mockXml2, 'Second');
      });

      expect(localStorage.getItem('xml-history-file-1')).toBeTruthy();

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.snapshots).toEqual([]);
      expect(result.current.currentIndex).toBe(-1);
      // Note: localStorage may still have empty state due to useEffect
      const stored = localStorage.getItem('xml-history-file-1');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.snapshots).toEqual([]);
        expect(parsed.currentIndex).toBe(-1);
      }
    });

    it('does nothing when fileId is undefined', () => {
      const { result } = renderHook(() => useXmlHistory(undefined));

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.snapshots).toEqual([]);
    });
  });

  describe('fileId changes', () => {
    it('loads new history when fileId changes', () => {
      localStorage.setItem('xml-history-file-1', JSON.stringify({
        snapshots: [{ xml: mockXml1, timestamp: Date.now(), label: 'File 1' }],
        currentIndex: 0,
      }));
      localStorage.setItem('xml-history-file-2', JSON.stringify({
        snapshots: [{ xml: mockXml2, timestamp: Date.now(), label: 'File 2' }],
        currentIndex: 0,
      }));

      const { result, rerender } = renderHook(
        ({ fileId }) => useXmlHistory(fileId),
        { initialProps: { fileId: 'file-1' } }
      );

      expect(result.current.snapshots[0].xml).toBe(mockXml1);

      rerender({ fileId: 'file-2' });

      expect(result.current.snapshots[0].xml).toBe(mockXml2);
    });

    it('does not reload when fileId stays the same', () => {
      const { result, rerender } = renderHook(
        ({ fileId }) => useXmlHistory(fileId),
        { initialProps: { fileId: 'file-1' } }
      );

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
      });

      const firstTimestamp = result.current.snapshots[0].timestamp;

      rerender({ fileId: 'file-1' });

      expect(result.current.snapshots[0].timestamp).toBe(firstTimestamp);
    });
  });

  describe('localStorage persistence', () => {
    it('saves history to localStorage on changes', () => {
      const { result } = renderHook(() => useXmlHistory('file-1'));

      act(() => {
        result.current.addSnapshot(mockXml1, 'First');
      });

      const stored = localStorage.getItem('xml-history-file-1');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.snapshots).toHaveLength(1);
      expect(parsed.snapshots[0].xml).toBe(mockXml1);
    });
  });
});
