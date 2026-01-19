import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectCamundaEngine, validateAndUploadFile } from '@src/features/starbase/utils/uploadValidation';
import { apiClient } from '@src/shared/api/client';

vi.mock('@src/shared/api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

vi.mock('@src/shared/api/apiErrorUtils', () => ({
  parseApiError: vi.fn((error, message) => ({
    message,
    status: error.status || 500,
  })),
}));

describe('uploadValidation', () => {
  describe('detectCamundaEngine', () => {
    it('detects Camunda 7 from standard BPMN', () => {
      const xmlString = `
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     xmlns:camunda="http://camunda.org/schema/1.0/bpmn">
          <process id="test"/>
        </definitions>
      `;
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString, 'application/xml');
      
      const result = detectCamundaEngine(xml);
      
      expect(result.isCamunda7).toBe(true);
      expect(result.isCamunda8).toBe(false);
    });

    it('detects Camunda 8 from Zeebe namespace', () => {
      const xmlString = `
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     xmlns:zeebe="http://camunda.org/schema/zeebe/1.0">
          <process id="test"/>
        </definitions>
      `;
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString, 'application/xml');
      
      const result = detectCamundaEngine(xml);
      
      expect(result.isCamunda7).toBe(false);
      expect(result.isCamunda8).toBe(true);
    });

    it('detects Camunda 8 from zeebe elements', () => {
      const xmlString = `
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     xmlns:zeebe="http://camunda.org/schema/zeebe/1.0">
          <process id="test">
            <serviceTask id="task">
              <zeebe:taskDefinition type="test"/>
            </serviceTask>
          </process>
        </definitions>
      `;
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString, 'application/xml');
      
      const result = detectCamundaEngine(xml);
      
      expect(result.isCamunda8).toBe(true);
    });

    it('defaults to Camunda 7 for plain BPMN', () => {
      const xmlString = `
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
          <process id="test"/>
        </definitions>
      `;
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString, 'application/xml');
      
      const result = detectCamundaEngine(xml);
      
      expect(result.isCamunda7).toBe(true);
      expect(result.isCamunda8).toBe(false);
    });
  });

  describe('validateAndUploadFile', () => {
    const mockQueryClient = {
      invalidateQueries: vi.fn(),
    };
    const mockShowToast = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('rejects non-BPMN/DMN files', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await validateAndUploadFile({
        file,
        projectId: 'proj-1',
        folderId: null,
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        kind: 'error',
        title: 'Upload failed',
        subtitle: 'Only .bpmn and .dmn files are supported.',
      });
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('handles file read errors', async () => {
      const file = {
        name: 'test.bpmn',
        text: vi.fn().mockRejectedValue(new Error('Read error')),
      } as any;

      await validateAndUploadFile({
        file,
        projectId: 'proj-1',
        folderId: null,
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        kind: 'error',
        title: 'Upload failed',
        subtitle: 'Could not read file contents.',
      });
    });

    it('rejects invalid XML', async () => {
      const file = {
        name: 'test.bpmn',
        text: vi.fn().mockResolvedValue('not xml'),
      } as any;

      await validateAndUploadFile({
        file,
        projectId: 'proj-1',
        folderId: null,
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        kind: 'error',
        title: 'Upload failed',
        subtitle: 'File is not valid XML.',
      });
    });

    it('rejects non-BPMN/DMN definitions', async () => {
      const xmlContent = '<root><element/></root>';
      const file = {
        name: 'test.bpmn',
        text: vi.fn().mockResolvedValue(xmlContent),
      } as any;

      await validateAndUploadFile({
        file,
        projectId: 'proj-1',
        folderId: null,
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        kind: 'error',
        title: 'Upload failed',
        subtitle: 'File is not a BPMN or DMN definition.',
      });
    });

    it('rejects Camunda 8 diagrams', async () => {
      const xmlContent = `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:zeebe="http://camunda.org/schema/zeebe/1.0"><process id="test"/></definitions>`;
      const file = {
        name: 'test.bpmn',
        text: vi.fn().mockResolvedValue(xmlContent),
      } as any;

      await validateAndUploadFile({
        file,
        projectId: 'proj-1',
        folderId: null,
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        kind: 'error',
        title: 'Upload failed',
        subtitle: 'Camunda 8 / Zeebe diagrams are not supported. Please upload a Camunda 7 BPMN/DMN file.',
      });
    });

    it('successfully uploads valid BPMN file', async () => {
      const xmlContent = `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"><process id="test"/></definitions>`;
      const file = {
        name: 'test.bpmn',
        text: vi.fn().mockResolvedValue(xmlContent),
      } as any;
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await validateAndUploadFile({
        file,
        projectId: 'proj-1',
        folderId: 'folder-1',
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/starbase-api/projects/proj-1/files',
        {
          type: 'bpmn',
          name: 'test.bpmn',
          folderId: 'folder-1',
          xml: xmlContent,
        }
      );
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['contents', 'proj-1', 'folder-1'],
      });
      expect(mockShowToast).toHaveBeenCalledWith({
        kind: 'success',
        title: 'File uploaded',
        subtitle: 'test.bpmn',
      });
    });

    it('successfully uploads valid DMN file', async () => {
      const xmlContent = `<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd" xmlns:dmn="http://www.omg.org/spec/DMN/20151101/dmn.xsd"><decision id="test"/></definitions>`;
      const file = {
        name: 'test.dmn',
        text: vi.fn().mockResolvedValue(xmlContent),
      } as any;
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await validateAndUploadFile({
        file,
        projectId: 'proj-1',
        folderId: null,
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/starbase-api/projects/proj-1/files',
        {
          type: 'dmn',
          name: 'test.dmn',
          folderId: null,
          xml: xmlContent,
        }
      );
    });

    it('handles 409 conflict errors', async () => {
      const xmlContent = `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"><process id="test"/></definitions>`;
      const file = {
        name: 'test.bpmn',
        text: vi.fn().mockResolvedValue(xmlContent),
      } as any;
      vi.mocked(apiClient.post).mockRejectedValue({ status: 409 });

      await validateAndUploadFile({
        file,
        projectId: 'proj-1',
        folderId: null,
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        kind: 'error',
        title: 'Upload failed',
        subtitle: 'A file with this name already exists in this folder.',
      });
    });

    it('handles general upload errors', async () => {
      const xmlContent = `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"><process id="test"/></definitions>`;
      const file = {
        name: 'test.bpmn',
        text: vi.fn().mockResolvedValue(xmlContent),
      } as any;
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      await validateAndUploadFile({
        file,
        projectId: 'proj-1',
        folderId: null,
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        kind: 'error',
        title: 'Upload failed',
        subtitle: 'Could not upload file. Please try again.',
      });
    });

    it('returns early if projectId is missing', async () => {
      const file = new File(['content'], 'test.bpmn', { type: 'text/xml' });

      await validateAndUploadFile({
        file,
        projectId: '',
        folderId: null,
        queryClient: mockQueryClient as any,
        showToast: mockShowToast,
      });

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });
});
