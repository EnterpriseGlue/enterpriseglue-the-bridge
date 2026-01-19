import { CamundaClient } from './client.js';
import type { ProcessDefinition, ProcessDefinitionXml } from './types.js';

export class ProcessDefinitionService {
  private client = new CamundaClient();

  async list(params?: {
    key?: string;
    nameLike?: string;
    latest?: boolean;
  }): Promise<ProcessDefinition[]> {
    return this.client.get<ProcessDefinition[]>('/process-definition', params);
  }

  async getById(id: string): Promise<ProcessDefinition> {
    return this.client.get<ProcessDefinition>(`/process-definition/${id}`);
  }

  async getXml(id: string): Promise<ProcessDefinitionXml> {
    return this.client.get<ProcessDefinitionXml>(`/process-definition/${id}/xml`);
  }

  async getActiveActivityCounts(id: string): Promise<Record<string, number>> {
    return this.client.get<Record<string, number>>(`/process-definition/${id}/statistics`, {
      incidents: true,
    });
  }
}

export const processDefinitionService = new ProcessDefinitionService();
