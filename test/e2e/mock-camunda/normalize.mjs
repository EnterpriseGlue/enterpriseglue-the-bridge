import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function parseArgs(argv) {
  const options = {
    input: process.env.MOCK_CAMUNDA_RAW_INPUT || path.resolve(process.cwd(), '.local/mock-camunda/raw/latest.json'),
    outputDir: process.env.MOCK_CAMUNDA_NORMALIZED_DIR || path.resolve(process.cwd(), '.local/mock-camunda/normalized'),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    const next = argv[index + 1]
    if (token === '--input' && next) {
      options.input = path.resolve(process.cwd(), next)
      index += 1
      continue
    }
    if (token === '--output-dir' && next) {
      options.outputDir = path.resolve(process.cwd(), next)
      index += 1
      continue
    }
  }

  return options
}

function stableStringify(value, space = 0) {
  return JSON.stringify(value, null, space)
}

function sortById(items) {
  return [...(items || [])].sort((a, b) => String(a?.id || '').localeCompare(String(b?.id || '')))
}

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)))
}

function createAliasFactory() {
  const counters = new Map()
  const cache = new Map()

  return function alias(prefix, original, explicitPrefix) {
    if (original === undefined || original === null || original === '') return original
    const cacheKey = `${prefix}::${String(original)}`
    if (cache.has(cacheKey)) return cache.get(cacheKey)
    const next = (counters.get(prefix) || 0) + 1
    counters.set(prefix, next)
    const label = explicitPrefix || prefix
    const value = `${label}-${String(next).padStart(3, '0')}`
    cache.set(cacheKey, value)
    return value
  }
}

function createValueSanitizer() {
  const alias = createAliasFactory()

  return function sanitizeValue(name, value) {
    if (value === null || value === undefined) return value
    if (typeof value === 'number' || typeof value === 'boolean') return value
    if (Array.isArray(value)) return value.map((item) => sanitizeValue(name, item))
    if (typeof value === 'object') {
      const output = {}
      for (const [key, nested] of Object.entries(value)) {
        output[key] = sanitizeValue(`${name}.${key}`, nested)
      }
      return output
    }

    const normalizedName = String(name || '').toLowerCase()
    if (normalizedName.includes('assignee') || normalizedName.includes('approver') || normalizedName.includes('user')) {
      return alias('actor', value, 'actor')
    }
    if (normalizedName.includes('reason')) {
      return alias('reason', value, 'reason')
    }
    if (normalizedName.includes('customer')) {
      return alias('customer', value, 'customer')
    }
    if (normalizedName.includes('item')) {
      return alias('item', value, 'item')
    }
    if (normalizedName.includes('risk') || normalizedName.includes('status') || normalizedName.includes('outcome')) {
      return alias('label', value, 'label')
    }
    return alias('text', value, 'text')
  }
}

function collectTimestamps(value, bucket = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectTimestamps(entry, bucket)
    return bucket
  }
  if (!value || typeof value !== 'object') return bucket
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string' && /(?:time|date)$/i.test(key) && !Number.isNaN(Date.parse(entry))) {
      bucket.push(entry)
      continue
    }
    if (key === 'timestamp' && typeof entry === 'string' && !Number.isNaN(Date.parse(entry))) {
      bucket.push(entry)
      continue
    }
    collectTimestamps(entry, bucket)
  }
  return bucket
}

function createTimestampShift(sample) {
  const timestamps = collectTimestamps(sample).map((value) => Date.parse(value)).filter((value) => Number.isFinite(value))
  if (timestamps.length === 0) {
    return (value) => value
  }
  const min = Math.min(...timestamps)
  const anchor = Date.parse('2026-03-09T10:00:00.000Z')
  return function shift(value) {
    if (typeof value !== 'string') return value
    const parsed = Date.parse(value)
    if (!Number.isFinite(parsed)) return value
    return new Date(anchor + (parsed - min)).toISOString()
  }
}

function selectCuratedSnapshots(raw) {
  const byId = new Map((raw.processInstances || []).map((item) => [item.processInstanceId, item]))
  const selectedIds = []
  const reasons = {}

  const add = (id, reason) => {
    if (!id || !byId.has(id) || reasons[id]) return
    reasons[id] = reason
    selectedIds.push(id)
  }

  const addFirstUnused = (items, reason) => {
    for (const item of items || []) {
      const candidateId = item?.processInstanceId
      if (!candidateId || reasons[candidateId] || !byId.has(candidateId)) continue
      add(candidateId, reason)
      return
    }
  }

  addFirstUnused(raw.candidates?.parallel, 'parallel')
  addFirstUnused(raw.candidates?.sequential, 'sequential')
  addFirstUnused(raw.candidates?.loop, 'loop')

  const decisionLinked = (raw.processInstances || []).find((item) => Array.isArray(item.decisionHistory) && item.decisionHistory.length > 0)
  add(decisionLinked?.processInstanceId, 'decision-linked')

  for (const state of ['ACTIVE', 'COMPLETED', 'EXTERNALLY_TERMINATED', 'SUSPENDED']) {
    const match = (raw.processInstances || []).find((item) => item?.historic?.state === state && !reasons[item.processInstanceId])
    add(match?.processInstanceId, `state:${state}`)
  }

  return {
    selectedSnapshots: selectedIds.map((id) => byId.get(id)).filter(Boolean),
    reasons,
  }
}

function collectFieldValues(items, field) {
  const output = []
  for (const item of items || []) {
    if (!item || typeof item !== 'object') continue
    if (item[field]) output.push(item[field])
  }
  return output
}

function buildScenarioCoverage(raw, idMaps) {
  return {
    parallel: unique((raw.candidates?.parallel || []).map((item) => remapValueWithMap(idMaps.processInstanceId, item?.processInstanceId)).filter(Boolean)),
    sequential: unique((raw.candidates?.sequential || []).map((item) => remapValueWithMap(idMaps.processInstanceId, item?.processInstanceId)).filter(Boolean)),
    loop: unique((raw.candidates?.loop || []).map((item) => remapValueWithMap(idMaps.processInstanceId, item?.processInstanceId)).filter(Boolean)),
  }
}

function buildScenarioTagsByInstance(scenarioCoverage) {
  const tags = new Map()
  for (const [scenario, processInstanceIds] of Object.entries(scenarioCoverage || {})) {
    for (const processInstanceId of processInstanceIds || []) {
      const list = tags.get(processInstanceId) || []
      list.push(scenario)
      tags.set(processInstanceId, list)
    }
  }
  return tags
}

function collectTreeIds(node, bucket) {
  if (!node || typeof node !== 'object') return
  if (node.id) bucket.activityInstanceIds.add(node.id)
  if (Array.isArray(node.executionIds)) {
    for (const executionId of node.executionIds) bucket.executionIds.add(executionId)
  }
  if (Array.isArray(node.incidentIds)) {
    for (const incidentId of node.incidentIds) bucket.incidentIds.add(incidentId)
  }
  for (const child of node.childActivityInstances || []) {
    collectTreeIds(child, bucket)
  }
}

function buildIdMaps(selectedSnapshots, selectionReasons) {
  const alias = createAliasFactory()
  const processDefinitionIds = new Set()
  const decisionDefinitionIds = new Set()
  const processInstanceIds = new Set()
  const activityInstanceIds = new Set()
  const executionIds = new Set()
  const taskIds = new Set()
  const variableIds = new Set()
  const decisionInstanceIds = new Set()
  const incidentIds = new Set()
  const jobIds = new Set()
  const deploymentIds = new Set()
  const drdIds = new Set()
  const businessKeys = new Set()
  const actorValues = new Set()

  for (const snapshot of selectedSnapshots) {
    if (!snapshot) continue
    processInstanceIds.add(snapshot.processInstanceId)
    if (snapshot.runtime?.definitionId) processDefinitionIds.add(snapshot.runtime.definitionId)
    if (snapshot.historic?.processDefinitionId) processDefinitionIds.add(snapshot.historic.processDefinitionId)
    if (snapshot.runtime?.businessKey) businessKeys.add(snapshot.runtime.businessKey)
    if (snapshot.historic?.businessKey) businessKeys.add(snapshot.historic.businessKey)
    collectTreeIds(snapshot.activityTree, { activityInstanceIds, executionIds, incidentIds })

    for (const entry of snapshot.activityHistory || []) {
      if (entry?.processDefinitionId) processDefinitionIds.add(entry.processDefinitionId)
      if (entry?.processInstanceId) processInstanceIds.add(entry.processInstanceId)
      if (entry?.activityInstanceId) activityInstanceIds.add(entry.activityInstanceId)
      if (entry?.parentActivityInstanceId) activityInstanceIds.add(entry.parentActivityInstanceId)
      if (entry?.executionId) executionIds.add(entry.executionId)
      if (entry?.taskId) taskIds.add(entry.taskId)
    }

    for (const entry of snapshot.historicVariables || []) {
      if (entry?.id) variableIds.add(entry.id)
      if (entry?.activityInstanceId) activityInstanceIds.add(entry.activityInstanceId)
      if (entry?.executionId) executionIds.add(entry.executionId)
      if (entry?.taskId) taskIds.add(entry.taskId)
    }

    for (const details of Object.values(snapshot.variableHistory || {})) {
      for (const entry of details || []) {
        if (entry?.variableInstanceId) variableIds.add(entry.variableInstanceId)
        if (entry?.activityInstanceId) activityInstanceIds.add(entry.activityInstanceId)
        if (entry?.executionId) executionIds.add(entry.executionId)
        if (entry?.taskId) taskIds.add(entry.taskId)
      }
    }

    for (const entry of snapshot.historicTasks || []) {
      if (entry?.id) taskIds.add(entry.id)
      if (entry?.activityInstanceId) activityInstanceIds.add(entry.activityInstanceId)
      if (entry?.executionId) executionIds.add(entry.executionId)
      if (entry?.assignee) actorValues.add(entry.assignee)
      if (entry?.owner) actorValues.add(entry.owner)
    }

    for (const entry of snapshot.decisionHistory || []) {
      if (entry?.id) decisionInstanceIds.add(entry.id)
      if (entry?.decisionDefinitionId) decisionDefinitionIds.add(entry.decisionDefinitionId)
      if (entry?.processDefinitionId) processDefinitionIds.add(entry.processDefinitionId)
      if (entry?.processInstanceId) processInstanceIds.add(entry.processInstanceId)
      if (entry?.activityInstanceId) activityInstanceIds.add(entry.activityInstanceId)
      if (entry?.rootDecisionInstanceId) decisionInstanceIds.add(entry.rootDecisionInstanceId)
    }

    for (const entry of snapshot.incidents || []) {
      if (entry?.id) incidentIds.add(entry.id)
      if (entry?.jobId) jobIds.add(entry.jobId)
    }

    for (const entry of snapshot.jobs || []) {
      if (entry?.id) jobIds.add(entry.id)
    }

    for (const [operationKey, entries] of Object.entries(snapshot.userOperations || {})) {
      const [, executionId] = operationKey.split(':')
      if (executionId) executionIds.add(executionId)
      for (const entry of entries || []) {
        if (entry?.userId) actorValues.add(entry.userId)
        if (entry?.newValue && String(entry.property || '').toLowerCase() === 'assignee') actorValues.add(entry.newValue)
        if (entry?.orgValue && String(entry.property || '').toLowerCase() === 'assignee') actorValues.add(entry.orgValue)
      }
    }
  }

  const processDefinitionIdMap = new Map()
  const processInstanceIdMap = new Map()
  const reasonLabels = {
    parallel: 'parallel-instance',
    sequential: 'sequential-instance',
    loop: 'loop-instance',
    'decision-linked': 'primary-instance',
  }

  for (const id of unique(Array.from(processDefinitionIds))) {
    processDefinitionIdMap.set(id, alias('process-definition', id, 'process-definition'))
  }
  for (const id of unique(Array.from(decisionDefinitionIds))) {
    processDefinitionIdMap.has(id)
    processDefinitionIdMap.set(id, processDefinitionIdMap.get(id) || alias('decision-definition', id, 'decision-definition'))
  }
  for (const id of unique(Array.from(processInstanceIds))) {
    const reason = selectionReasons[id]
    processInstanceIdMap.set(id, alias('process-instance', id, reasonLabels[reason] || 'process-instance'))
  }

  return {
    processDefinitionId: processDefinitionIdMap,
    decisionDefinitionId: new Map(unique(Array.from(decisionDefinitionIds)).map((id) => [id, alias('decision-definition', id, 'decision-definition')])),
    processInstanceId: processInstanceIdMap,
    activityInstanceId: new Map(unique(Array.from(activityInstanceIds)).map((id) => [id, alias('activity-instance', id, 'activity-instance')])),
    executionId: new Map(unique(Array.from(executionIds)).map((id) => [id, alias('execution', id, 'execution')])),
    taskId: new Map(unique(Array.from(taskIds)).map((id) => [id, alias('task', id, 'task')])),
    variableId: new Map(unique(Array.from(variableIds)).map((id) => [id, alias('variable', id, 'variable')])),
    decisionInstanceId: new Map(unique(Array.from(decisionInstanceIds)).map((id) => [id, alias('decision-instance', id, 'decision-instance')])),
    incidentId: new Map(unique(Array.from(incidentIds)).map((id) => [id, alias('incident', id, 'incident')])),
    jobId: new Map(unique(Array.from(jobIds)).map((id) => [id, alias('job', id, 'job')])),
    deploymentId: new Map(unique(Array.from(deploymentIds)).map((id) => [id, alias('deployment', id, 'deployment')])),
    drdId: new Map(unique(Array.from(drdIds)).map((id) => [id, alias('drd', id, 'drd')])),
    businessKey: new Map(unique(Array.from(businessKeys)).map((id) => [id, alias('business-key', id, 'business-key')])),
    actor: new Map(unique(Array.from(actorValues)).map((id) => [id, alias('actor', id, 'actor')])),
  }
}

function remapValueWithMap(map, value) {
  return map?.has(value) ? map.get(value) : value
}

function remapProcessDefinition(definition, idMaps, shiftTimestamp) {
  if (!definition) return null
  return {
    ...definition,
    id: remapValueWithMap(idMaps.processDefinitionId, definition.id),
    deploymentId: remapValueWithMap(idMaps.deploymentId, definition.deploymentId),
  }
}

function remapDecisionDefinition(definition, idMaps) {
  if (!definition) return null
  return {
    ...definition,
    id: remapValueWithMap(idMaps.decisionDefinitionId, definition.id),
    decisionRequirementsDefinitionId: remapValueWithMap(idMaps.drdId, definition.decisionRequirementsDefinitionId),
    deploymentId: remapValueWithMap(idMaps.deploymentId, definition.deploymentId),
  }
}

function remapRuntimeInstance(instance, idMaps) {
  if (!instance) return null
  return {
    ...instance,
    id: remapValueWithMap(idMaps.processInstanceId, instance.id),
    definitionId: remapValueWithMap(idMaps.processDefinitionId, instance.definitionId),
    businessKey: remapValueWithMap(idMaps.businessKey, instance.businessKey),
  }
}

function remapHistoricInstance(instance, idMaps, shiftTimestamp) {
  if (!instance) return null
  return {
    ...instance,
    id: remapValueWithMap(idMaps.processInstanceId, instance.id),
    processDefinitionId: remapValueWithMap(idMaps.processDefinitionId, instance.processDefinitionId),
    businessKey: remapValueWithMap(idMaps.businessKey, instance.businessKey),
    startTime: shiftTimestamp(instance.startTime),
    endTime: shiftTimestamp(instance.endTime),
  }
}

function remapVariables(variables, sanitizeValue) {
  const output = {}
  for (const [name, variable] of Object.entries(variables || {})) {
    output[name] = {
      ...variable,
      value: sanitizeValue(name, variable?.value),
      valueInfo: sanitizeValue(`${name}.valueInfo`, variable?.valueInfo),
    }
  }
  return output
}

function remapActivityTree(node, idMaps) {
  if (!node) return null
  return {
    ...node,
    id: remapValueWithMap(idMaps.activityInstanceId, node.id),
    processInstanceId: remapValueWithMap(idMaps.processInstanceId, node.processInstanceId),
    processDefinitionId: remapValueWithMap(idMaps.processDefinitionId, node.processDefinitionId),
    executionIds: (node.executionIds || []).map((value) => remapValueWithMap(idMaps.executionId, value)),
    incidentIds: (node.incidentIds || []).map((value) => remapValueWithMap(idMaps.incidentId, value)),
    childActivityInstances: (node.childActivityInstances || []).map((child) => remapActivityTree(child, idMaps)),
  }
}

function remapActivityHistory(entries, idMaps, shiftTimestamp) {
  return sortById(entries).map((entry, index) => ({
    ...entry,
    id: `activity-history-${String(index + 1).padStart(3, '0')}`,
    activityInstanceId: remapValueWithMap(idMaps.activityInstanceId, entry.activityInstanceId),
    parentActivityInstanceId: remapValueWithMap(idMaps.activityInstanceId, entry.parentActivityInstanceId),
    processDefinitionId: remapValueWithMap(idMaps.processDefinitionId, entry.processDefinitionId),
    processInstanceId: remapValueWithMap(idMaps.processInstanceId, entry.processInstanceId),
    executionId: remapValueWithMap(idMaps.executionId, entry.executionId),
    taskId: remapValueWithMap(idMaps.taskId, entry.taskId),
    startTime: shiftTimestamp(entry.startTime),
    endTime: shiftTimestamp(entry.endTime),
  }))
}

function remapHistoricVariables(entries, idMaps, shiftTimestamp, sanitizeValue) {
  return sortById(entries).map((entry) => ({
    ...entry,
    id: remapValueWithMap(idMaps.variableId, entry.id),
    processInstanceId: remapValueWithMap(idMaps.processInstanceId, entry.processInstanceId),
    executionId: remapValueWithMap(idMaps.executionId, entry.executionId),
    activityInstanceId: remapValueWithMap(idMaps.activityInstanceId, entry.activityInstanceId),
    taskId: remapValueWithMap(idMaps.taskId, entry.taskId),
    createTime: shiftTimestamp(entry.createTime),
    value: sanitizeValue(entry.name, entry.value),
    valueInfo: sanitizeValue(`${entry.name}.valueInfo`, entry.valueInfo),
  }))
}

function remapVariableHistory(entries, idMaps, shiftTimestamp, sanitizeValue) {
  return sortById(entries).map((entry, index) => ({
    ...entry,
    id: `variable-history-${String(index + 1).padStart(3, '0')}`,
    variableInstanceId: remapValueWithMap(idMaps.variableId, entry.variableInstanceId),
    activityInstanceId: remapValueWithMap(idMaps.activityInstanceId, entry.activityInstanceId),
    executionId: remapValueWithMap(idMaps.executionId, entry.executionId),
    taskId: remapValueWithMap(idMaps.taskId, entry.taskId),
    time: shiftTimestamp(entry.time),
    value: sanitizeValue(entry.variableName, entry.value),
  }))
}

function remapHistoricTasks(entries, idMaps, shiftTimestamp) {
  return sortById(entries).map((entry) => ({
    ...entry,
    id: remapValueWithMap(idMaps.taskId, entry.id),
    assignee: remapValueWithMap(idMaps.actor, entry.assignee),
    owner: remapValueWithMap(idMaps.actor, entry.owner),
    activityInstanceId: remapValueWithMap(idMaps.activityInstanceId, entry.activityInstanceId),
    executionId: remapValueWithMap(idMaps.executionId, entry.executionId),
    startTime: shiftTimestamp(entry.startTime),
    endTime: shiftTimestamp(entry.endTime),
    dueDate: shiftTimestamp(entry.dueDate),
  }))
}

function remapDecisionHistory(entries, idMaps, shiftTimestamp) {
  return sortById(entries).map((entry) => ({
    ...entry,
    id: remapValueWithMap(idMaps.decisionInstanceId, entry.id),
    rootDecisionInstanceId: remapValueWithMap(idMaps.decisionInstanceId, entry.rootDecisionInstanceId),
    decisionDefinitionId: remapValueWithMap(idMaps.decisionDefinitionId, entry.decisionDefinitionId),
    processDefinitionId: remapValueWithMap(idMaps.processDefinitionId, entry.processDefinitionId),
    processInstanceId: remapValueWithMap(idMaps.processInstanceId, entry.processInstanceId),
    activityInstanceId: remapValueWithMap(idMaps.activityInstanceId, entry.activityInstanceId),
    evaluationTime: shiftTimestamp(entry.evaluationTime),
  }))
}

function remapDecisionIo(entries, sanitizeValue) {
  return sortById(entries).map((entry, index) => ({
    ...entry,
    id: `decision-io-${String(index + 1).padStart(3, '0')}`,
    value: sanitizeValue(entry.clauseName, entry.value),
  }))
}

function remapIncidents(entries, idMaps, shiftTimestamp) {
  return sortById(entries).map((entry) => ({
    ...entry,
    id: remapValueWithMap(idMaps.incidentId, entry.id),
    processInstanceId: remapValueWithMap(idMaps.processInstanceId, entry.processInstanceId),
    jobId: remapValueWithMap(idMaps.jobId, entry.jobId),
    configuration: remapValueWithMap(idMaps.jobId, entry.configuration),
    incidentTimestamp: shiftTimestamp(entry.incidentTimestamp),
  }))
}

function remapJobs(entries, idMaps, shiftTimestamp) {
  return sortById(entries).map((entry) => ({
    ...entry,
    id: remapValueWithMap(idMaps.jobId, entry.id),
    processInstanceId: remapValueWithMap(idMaps.processInstanceId, entry.processInstanceId),
    dueDate: shiftTimestamp(entry.dueDate),
  }))
}

function remapExternalTasks(entries, idMaps, shiftTimestamp) {
  return sortById(entries).map((entry, index) => ({
    ...entry,
    id: entry?.id ? `external-task-${String(index + 1).padStart(3, '0')}` : entry?.id,
    processInstanceId: remapValueWithMap(idMaps.processInstanceId, entry.processInstanceId),
    executionId: remapValueWithMap(idMaps.executionId, entry.executionId),
    activityInstanceId: remapValueWithMap(idMaps.activityInstanceId, entry.activityInstanceId),
    lockExpirationTime: shiftTimestamp(entry.lockExpirationTime),
  }))
}

function remapUserOperations(groups, idMaps, shiftTimestamp) {
  const output = {}
  for (const [key, entries] of Object.entries(groups || {})) {
    const [processInstanceId, executionId] = key.split(':')
    const mappedKey = `${remapValueWithMap(idMaps.processInstanceId, processInstanceId)}:${remapValueWithMap(idMaps.executionId, executionId)}`
    output[mappedKey] = sortById(entries).map((entry, index) => ({
      ...entry,
      id: `user-operation-${String(index + 1).padStart(3, '0')}`,
      userId: remapValueWithMap(idMaps.actor, entry.userId),
      orgValue: String(entry.property || '').toLowerCase() === 'assignee' ? remapValueWithMap(idMaps.actor, entry.orgValue) : entry.orgValue,
      newValue: String(entry.property || '').toLowerCase() === 'assignee' ? remapValueWithMap(idMaps.actor, entry.newValue) : entry.newValue,
      timestamp: shiftTimestamp(entry.timestamp),
      annotation: entry.annotation ? `operation-${String(index + 1).padStart(3, '0')}` : entry.annotation,
    }))
  }
  return output
}

function remapXmlMap(xmlById, idMap, xmlField) {
  const output = {}
  for (const [id, value] of Object.entries(xmlById || {})) {
    const mappedId = remapValueWithMap(idMap, id)
    if (!value) {
      output[mappedId] = value
      continue
    }
    output[mappedId] = value?.[xmlField] || value
  }
  return output
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const raw = JSON.parse(await readFile(options.input, 'utf8'))
  const { selectedSnapshots, reasons } = selectCuratedSnapshots(raw)
  if (selectedSnapshots.length === 0) {
    throw new Error(`No candidate process instances found in ${options.input}`)
  }

  const shiftTimestamp = createTimestampShift(selectedSnapshots)
  const sanitizeValue = createValueSanitizer()
  const idMaps = buildIdMaps(selectedSnapshots, reasons)

  const selectedDefinitionIds = unique(selectedSnapshots.map((item) => item.processDefinitionId).filter(Boolean))
  const selectedProcessDefinitions = sortById((raw.processDefinitions || []).filter((item) => selectedDefinitionIds.includes(item.id)))
  const selectedDecisionDefinitionIds = unique(selectedSnapshots.flatMap((item) => collectFieldValues(item.decisionHistory, 'decisionDefinitionId')))
  const selectedDecisionDefinitions = sortById((raw.decisionDefinitions || []).filter((item) => selectedDecisionDefinitionIds.includes(item.id)))

  for (const definition of selectedProcessDefinitions) {
    if (definition?.deploymentId && !idMaps.deploymentId.has(definition.deploymentId)) {
      idMaps.deploymentId.set(definition.deploymentId, `deployment-${String(idMaps.deploymentId.size + 1).padStart(3, '0')}`)
    }
  }
  for (const definition of selectedDecisionDefinitions) {
    if (definition?.deploymentId && !idMaps.deploymentId.has(definition.deploymentId)) {
      idMaps.deploymentId.set(definition.deploymentId, `deployment-${String(idMaps.deploymentId.size + 1).padStart(3, '0')}`)
    }
    if (definition?.decisionRequirementsDefinitionId && !idMaps.drdId.has(definition.decisionRequirementsDefinitionId)) {
      idMaps.drdId.set(definition.decisionRequirementsDefinitionId, `drd-${String(idMaps.drdId.size + 1).padStart(3, '0')}`)
    }
  }

  const scenarioCoverage = buildScenarioCoverage(raw, idMaps)
  const scenarioTagsByInstance = buildScenarioTagsByInstance(scenarioCoverage)

  const fixtures = {
    processDefinitions: selectedProcessDefinitions.map((item) => remapProcessDefinition(item, idMaps, shiftTimestamp)),
    decisionDefinitions: selectedDecisionDefinitions.map((item) => remapDecisionDefinition(item, idMaps)),
    runtimeInstances: selectedSnapshots.map((item) => remapRuntimeInstance(item.runtime, idMaps)).filter(Boolean),
    historicProcessInstances: selectedSnapshots.map((item) => remapHistoricInstance(item.historic, idMaps, shiftTimestamp)).filter(Boolean),
    processDefinitionXml: remapXmlMap(Object.fromEntries(Object.entries(raw.processDefinitionXml || {}).filter(([id]) => selectedDefinitionIds.includes(id))), idMaps.processDefinitionId, 'bpmn20Xml'),
    processDefinitionStatistics: Object.fromEntries(Object.entries(raw.processDefinitionStatistics || {}).filter(([id]) => selectedDefinitionIds.includes(id)).map(([id, value]) => [remapValueWithMap(idMaps.processDefinitionId, id), value || []])),
    decisionDefinitionXml: remapXmlMap(Object.fromEntries(Object.entries(raw.decisionDefinitionXml || {}).filter(([id]) => selectedDecisionDefinitionIds.includes(id))), idMaps.decisionDefinitionId, 'dmnXml'),
    processInstances: selectedSnapshots.map((snapshot) => {
      const mappedProcessInstanceId = remapValueWithMap(idMaps.processInstanceId, snapshot.processInstanceId)
      const activityHistory = remapActivityHistory(snapshot.activityHistory, idMaps, shiftTimestamp)
      const historicVariables = remapHistoricVariables(snapshot.historicVariables, idMaps, shiftTimestamp, sanitizeValue)
      const decisionHistory = remapDecisionHistory(snapshot.decisionHistory, idMaps, shiftTimestamp)
      return {
        processInstanceId: mappedProcessInstanceId,
        processDefinitionId: remapValueWithMap(idMaps.processDefinitionId, snapshot.processDefinitionId),
        selectionReason: reasons[snapshot.processInstanceId],
        runtime: remapRuntimeInstance(snapshot.runtime, idMaps),
        historic: remapHistoricInstance(snapshot.historic, idMaps, shiftTimestamp),
        variables: remapVariables(snapshot.variables, sanitizeValue),
        activityTree: remapActivityTree(snapshot.activityTree, idMaps),
        activityHistory,
        historicVariables,
        variableHistory: Object.fromEntries(Object.entries(snapshot.variableHistory || {}).map(([id, entries]) => [remapValueWithMap(idMaps.variableId, id), remapVariableHistory(entries, idMaps, shiftTimestamp, sanitizeValue)])),
        historicTasks: remapHistoricTasks(snapshot.historicTasks, idMaps, shiftTimestamp),
        decisionHistory,
        decisionInputs: Object.fromEntries(Object.entries(snapshot.decisionInputs || {}).map(([id, entries]) => [remapValueWithMap(idMaps.decisionInstanceId, id), remapDecisionIo(entries, sanitizeValue)])),
        decisionOutputs: Object.fromEntries(Object.entries(snapshot.decisionOutputs || {}).map(([id, entries]) => [remapValueWithMap(idMaps.decisionInstanceId, id), remapDecisionIo(entries, sanitizeValue)])),
        incidents: remapIncidents(snapshot.incidents, idMaps, shiftTimestamp),
        jobs: remapJobs(snapshot.jobs, idMaps, shiftTimestamp),
        externalTasks: remapExternalTasks(snapshot.externalTasks, idMaps, shiftTimestamp),
        userOperations: remapUserOperations(snapshot.userOperations, idMaps, shiftTimestamp),
      }
    }),
  }

  const normalized = {
    normalizedAt: new Date().toISOString(),
    sourceSnapshot: path.basename(options.input),
    selectedProcessInstances: fixtures.processInstances.map((item) => ({
      processInstanceId: item.processInstanceId,
      selectionReason: item.selectionReason,
      scenarioTags: scenarioTagsByInstance.get(item.processInstanceId) || [],
    })),
    scenarioCoverage,
    summary: {
      processDefinitions: fixtures.processDefinitions.length,
      decisionDefinitions: fixtures.decisionDefinitions.length,
      runtimeInstances: fixtures.runtimeInstances.length,
      historicProcessInstances: fixtures.historicProcessInstances.length,
      processInstances: fixtures.processInstances.length,
    },
    fixtures,
  }

  await mkdir(options.outputDir, { recursive: true })
  const outputPath = path.join(options.outputDir, 'latest.json')
  await writeFile(outputPath, `${stableStringify(normalized, 2)}\n`)

  console.log(JSON.stringify({
    input: options.input,
    outputPath,
    summary: normalized.summary,
    selectedProcessInstances: normalized.selectedProcessInstances,
    scenarioCoverage: normalized.scenarioCoverage,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
