declare module '../mock-camunda/data-runtime.mjs' {
  export const primaryInstanceId: string | null
  export const sequentialInstanceId: string | null
  export const parallelInstanceId: string | null
  export const loopInstanceId: string | null
  export const decisionDefinition: any
  export const historicProcessInstancesById: Map<string, any>
  export const runtimeInstancesById: Map<string, any>
  export const processInstanceVariables: Map<string, Record<string, any>>
  export const activityHistory: Map<string, any[]>
  export function filterProcessDefinitions(searchParams: URLSearchParams): any[]
  export function filterDecisionDefinitions(searchParams: URLSearchParams): any[]
}
