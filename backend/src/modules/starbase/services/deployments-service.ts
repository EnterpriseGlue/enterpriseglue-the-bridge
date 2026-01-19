/**
 * Starbase deployments service
 */

import {
  getDeployments,
  getDeployment,
  deleteDeployment,
  getProcessDefinitionDiagram,
} from '@shared/services/bpmn-engine-client.js'

export async function listDeployments(params: any) {
  return getDeployments<any[]>(params)
}

export async function fetchDeploymentById(id: string) {
  return getDeployment<any>(id)
}

export async function removeDeployment(id: string, cascade: boolean) {
  return deleteDeployment(id, cascade)
}

export async function fetchProcessDefinitionDiagram(id: string) {
  return getProcessDefinitionDiagram<any>(id)
}
