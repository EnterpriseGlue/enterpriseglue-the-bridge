/**
 * Mission Control tasks service
 */

import {
  getTasks,
  getTask,
  getTaskCount,
  claimTask,
  unclaimTask,
  setTaskAssignee,
  completeTask,
  getTaskVariables,
  updateTaskVariables,
  getTaskForm,
} from '@shared/services/bpmn-engine-client.js'

export async function listTasks(params: any) {
  return getTasks<any[]>(params)
}

export async function getTaskCountByQuery(params: any) {
  return getTaskCount<any>(params)
}

export async function getTaskById(id: string) {
  return getTask<any>(id)
}

export async function getTaskVariablesById(id: string) {
  return getTaskVariables<any>(id)
}

export async function updateTaskVariablesById(id: string, body: any) {
  return updateTaskVariables<any>(id, body)
}

export async function getTaskFormById(id: string) {
  return getTaskForm<any>(id)
}

export async function claimTaskById(id: string, body: any) {
  return claimTask(id, body)
}

export async function unclaimTaskById(id: string) {
  return unclaimTask(id)
}

export async function setTaskAssigneeById(id: string, body: any) {
  return setTaskAssignee(id, body)
}

export async function completeTaskById(id: string, body: any) {
  return completeTask<any>(id, body)
}
