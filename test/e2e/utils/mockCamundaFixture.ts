import { readFile } from 'node:fs/promises'
import path from 'node:path'

type MockProcessFixture = {
  primaryInstanceId: string
  primaryProcessDefinitionKey: string
  primaryProcessDefinitionName: string
  primaryVariableName: string | null
  primaryVariableValue: unknown
  primaryActivityId: string | null
  primaryActivityName: string | null
  listProcessDefinitionKey: string | null
  listProcessDefinitionName: string | null
}

type MockDecisionFixture = {
  decisionDefinitionKey: string | null
  decisionDefinitionName: string | null
  decisionDefinitionVersion: number | null
}

type MockExecutionPatternFixture = {
  sequentialInstanceId: string
  parallelInstanceId: string
  loopInstanceId: string
}

let processFixturePromise: Promise<MockProcessFixture> | null = null
let decisionFixturePromise: Promise<MockDecisionFixture> | null = null
let executionPatternFixturePromise: Promise<MockExecutionPatternFixture> | null = null

function truthy(value: string | undefined) {
  return value === '1' || value === 'true' || value === 'yes'
}

function fallbackProcessFixture(): MockProcessFixture {
  return {
    primaryInstanceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    primaryProcessDefinitionKey: 'invoice-process',
    primaryProcessDefinitionName: 'Invoice Approval',
    primaryVariableName: 'customerId',
    primaryVariableValue: 'ACME-42',
    primaryActivityId: 'Activity_Review',
    primaryActivityName: 'Review Invoice',
    listProcessDefinitionKey: 'invoice-process',
    listProcessDefinitionName: 'Invoice Approval',
  }
}

function fallbackDecisionFixture(): MockDecisionFixture {
  return {
    decisionDefinitionKey: 'invoice-risk',
    decisionDefinitionName: 'Invoice Risk',
    decisionDefinitionVersion: 1,
  }
}

function fallbackExecutionPatternFixture(): MockExecutionPatternFixture {
  return {
    sequentialInstanceId: '11111111-2222-4333-8444-555555555555',
    parallelInstanceId: '66666666-7777-4888-8999-000000000000',
    loopInstanceId: '99999999-aaaa-4bbb-8ccc-dddddddddddd',
  }
}

function resolveAdaptedBundlePath() {
  const configured = process.env.MOCK_CAMUNDA_ADAPTED_BUNDLE
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured)
  }
  return path.resolve(process.cwd(), 'test/e2e/mock-camunda/.generated/latest.json')
}

async function loadAdaptedBundle() {
  if (!truthy(process.env.MOCK_CAMUNDA_USE_ADAPTED_BUNDLE) && !process.env.MOCK_CAMUNDA_ADAPTED_BUNDLE) {
    return null
  }
  try {
    return JSON.parse(await readFile(resolveAdaptedBundlePath(), 'utf8'))
  } catch {
    return null
  }
}

export async function getMockProcessFixture(): Promise<MockProcessFixture> {
  if (!processFixturePromise) {
    processFixturePromise = (async () => {
      const bundle = await loadAdaptedBundle()
      if (!bundle) return fallbackProcessFixture()
      const selectionReasons = bundle.selectionReasons || {}
      const primaryInstanceId = Object.entries(selectionReasons).find(([, meta]: any) => meta?.selectionReason === 'decision-linked')?.[0]
        || bundle.processInstances?.[0]?.processInstanceId
        || fallbackProcessFixture().primaryInstanceId
      const historic = bundle.historicProcessInstancesById?.[primaryInstanceId] || null
      const runtime = bundle.runtimeInstancesById?.[primaryInstanceId] || null
      const variables = bundle.processInstanceVariables?.[primaryInstanceId] || {}
      const activityHistory = bundle.activityHistory?.[primaryInstanceId] || []
      const processDefinitions = bundle.processDefinitions || []
      const firstNamedDefinition = processDefinitions.find((definition: any) => definition?.name) || processDefinitions[0] || null
      const primaryVariableName = Object.keys(variables)[0] || null
      const primaryActivity = activityHistory.find((entry: any) => entry?.activityType !== 'startEvent') || activityHistory[0] || null
      return {
        primaryInstanceId,
        primaryProcessDefinitionKey: String(historic?.processDefinitionKey || runtime?.definitionKey || firstNamedDefinition?.key || ''),
        primaryProcessDefinitionName: String(historic?.processDefinitionName || firstNamedDefinition?.name || ''),
        primaryVariableName,
        primaryVariableValue: primaryVariableName ? variables[primaryVariableName]?.value : null,
        primaryActivityId: primaryActivity?.activityId || null,
        primaryActivityName: primaryActivity?.activityName || null,
        listProcessDefinitionKey: firstNamedDefinition?.key || null,
        listProcessDefinitionName: firstNamedDefinition?.name || null,
      }
    })()
  }
  return processFixturePromise
}

export async function getMockDecisionFixture(): Promise<MockDecisionFixture> {
  if (!decisionFixturePromise) {
    decisionFixturePromise = (async () => {
      const bundle = await loadAdaptedBundle()
      if (!bundle) return fallbackDecisionFixture()
      const decisionDefinition = bundle.primaryDecisionDefinition || bundle.decisionDefinitions?.[0] || null
      return {
        decisionDefinitionKey: decisionDefinition?.key || null,
        decisionDefinitionName: decisionDefinition?.name || null,
        decisionDefinitionVersion: typeof decisionDefinition?.version === 'number' ? decisionDefinition.version : null,
      }
    })()
  }
  return decisionFixturePromise
}

export async function getMockExecutionPatternFixture(): Promise<MockExecutionPatternFixture> {
  if (!executionPatternFixturePromise) {
    executionPatternFixturePromise = (async () => {
      return fallbackExecutionPatternFixture()
    })()
  }
  return executionPatternFixturePromise
}
