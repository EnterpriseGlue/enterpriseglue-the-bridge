/**
 * Mission Control external tasks service
 */

import {
  fetchAndLockExternalTasks,
  getExternalTasks,
  completeExternalTask,
  handleExternalTaskFailure,
  handleExternalTaskBpmnError,
  extendExternalTaskLock,
  unlockExternalTask,
} from '@shared/services/bpmn-engine-client.js'

export async function fetchAndLockTasks(body: any) {
  return fetchAndLockExternalTasks<any[]>(body)
}

export async function listExternalTasks(params: any) {
  return getExternalTasks<any[]>(params)
}

export async function completeTask(id: string, body: any) {
  return completeExternalTask(id, body)
}

export async function failTask(id: string, body: any) {
  return handleExternalTaskFailure(id, body)
}

export async function bpmnErrorTask(id: string, body: any) {
  return handleExternalTaskBpmnError(id, body)
}

export async function extendTaskLock(id: string, body: any) {
  return extendExternalTaskLock(id, body)
}

export async function unlockTask(id: string) {
  return unlockExternalTask(id)
}
