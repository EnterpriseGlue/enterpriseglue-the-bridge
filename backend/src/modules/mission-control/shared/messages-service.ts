/**
 * Mission Control messages service
 */

import { correlateMessage, deliverSignal } from '@shared/services/bpmn-engine-client.js'

export async function sendMessage(body: any) {
  return correlateMessage<any>(body)
}

export async function sendSignal(body: any) {
  return deliverSignal(body)
}
