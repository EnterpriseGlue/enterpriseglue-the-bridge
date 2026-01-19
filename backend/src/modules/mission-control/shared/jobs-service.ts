/**
 * Mission Control jobs service
 */

import {
  getJobs,
  getJob,
  executeJob,
  setJobRetries,
  setJobSuspensionState,
  getJobDefinitions,
  setJobDefinitionRetries,
  setJobDefinitionSuspensionState,
} from '@shared/services/bpmn-engine-client.js'

export async function listJobs(params: any) {
  return getJobs<any[]>(params)
}

export async function getJobById(id: string) {
  return getJob<any>(id)
}

export async function executeJobById(id: string) {
  return executeJob(id)
}

export async function setJobRetriesById(id: string, body: any) {
  return setJobRetries(id, body)
}

export async function setJobSuspensionStateById(id: string, body: any) {
  return setJobSuspensionState(id, body)
}

export async function listJobDefinitions(params: any) {
  return getJobDefinitions<any[]>(params)
}

export async function setJobDefinitionRetriesById(id: string, body: any) {
  return setJobDefinitionRetries(id, body)
}

export async function setJobDefinitionSuspensionStateById(id: string, body: any) {
  return setJobDefinitionSuspensionState(id, body)
}
