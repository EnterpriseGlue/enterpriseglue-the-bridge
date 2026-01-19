/**
 * Mission Control metrics service
 */

import { getMetrics, getMetricByName } from '@shared/services/bpmn-engine-client.js'

export async function listMetrics(params: any) {
  return getMetrics<any>(params)
}

export async function getMetric(name: string, params: any) {
  return getMetricByName<any>(name, params)
}
