import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function parseArgs(argv) {
  const options = {
    input: process.env.MOCK_CAMUNDA_NORMALIZED_INPUT || path.resolve(process.cwd(), '.local/mock-camunda/normalized/latest.json'),
    outputDir: process.env.MOCK_CAMUNDA_ADAPTED_DIR || path.resolve(process.cwd(), 'test/e2e/mock-camunda/.generated'),
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

function objectEntriesSorted(value) {
  return Object.entries(value || {}).sort(([left], [right]) => left.localeCompare(right))
}

function toObjectById(items) {
  return Object.fromEntries((items || []).filter((item) => item?.id).map((item) => [item.id, item]))
}

function groupBy(items, keySelector) {
  const output = {}
  for (const item of items || []) {
    const key = keySelector(item)
    if (!key) continue
    if (!output[key]) output[key] = []
    output[key].push(item)
  }
  return output
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const normalized = JSON.parse(await readFile(options.input, 'utf8'))
  const fixtures = normalized.fixtures || {}
  const processInstances = fixtures.processInstances || []
  const decisionDefinitions = fixtures.decisionDefinitions || []

  const bundle = {
    adaptedAt: new Date().toISOString(),
    sourceNormalizedSnapshot: path.basename(options.input),
    summary: {
      processDefinitions: (fixtures.processDefinitions || []).length,
      decisionDefinitions: decisionDefinitions.length,
      runtimeInstances: (fixtures.runtimeInstances || []).length,
      historicProcessInstances: (fixtures.historicProcessInstances || []).length,
      processInstances: processInstances.length,
    },
    scenarioCoverage: normalized.scenarioCoverage || {},
    processDefinitions: fixtures.processDefinitions || [],
    processDefinitionsById: toObjectById(fixtures.processDefinitions || []),
    runtimeInstances: fixtures.runtimeInstances || [],
    runtimeInstancesById: toObjectById(fixtures.runtimeInstances || []),
    historicProcessInstances: fixtures.historicProcessInstances || [],
    historicProcessInstancesById: toObjectById(fixtures.historicProcessInstances || []),
    processDefinitionXml: fixtures.processDefinitionXml || {},
    processDefinitionStatistics: fixtures.processDefinitionStatistics || {},
    processInstanceVariables: Object.fromEntries(processInstances.map((item) => [item.processInstanceId, item.variables || {}])),
    activityTrees: Object.fromEntries(processInstances.map((item) => [item.processInstanceId, item.activityTree || null])),
    activityHistory: Object.fromEntries(processInstances.map((item) => [item.processInstanceId, item.activityHistory || []])),
    historicVariables: Object.fromEntries(processInstances.map((item) => [item.processInstanceId, item.historicVariables || []])),
    variableHistory: Object.assign({}, ...processInstances.map((item) => item.variableHistory || {})),
    historicTasks: Object.fromEntries(processInstances.map((item) => [item.processInstanceId, item.historicTasks || []])),
    incidents: Object.fromEntries(processInstances.map((item) => [item.processInstanceId, item.incidents || []])),
    jobs: Object.fromEntries(processInstances.map((item) => [item.processInstanceId, item.jobs || []])),
    externalTasks: Object.fromEntries(processInstances.map((item) => [item.processInstanceId, item.externalTasks || []])),
    decisionDefinitions,
    decisionDefinitionsById: toObjectById(decisionDefinitions),
    primaryDecisionDefinition: decisionDefinitions[0] || null,
    primaryDecisionDefinitionXml: decisionDefinitions[0] ? (fixtures.decisionDefinitionXml || {})[decisionDefinitions[0].id] || null : null,
    decisionDefinitionXml: fixtures.decisionDefinitionXml || {},
    decisionHistory: Object.fromEntries(processInstances.map((item) => [item.processInstanceId, item.decisionHistory || []])),
    decisionInputs: Object.assign({}, ...processInstances.map((item) => item.decisionInputs || {})),
    decisionOutputs: Object.assign({}, ...processInstances.map((item) => item.decisionOutputs || {})),
    userOperations: Object.assign({}, ...processInstances.map((item) => item.userOperations || {})),
    processInstances,
    selectionReasons: Object.fromEntries((normalized.selectedProcessInstances || []).map((item) => [item.processInstanceId, {
      selectionReason: item.selectionReason,
      scenarioTags: item.scenarioTags || [],
    }])),
    indexes: {
      processDefinitionToHistoricInstanceIds: groupBy(fixtures.historicProcessInstances || [], (item) => item?.processDefinitionId),
      processDefinitionToRuntimeInstanceIds: groupBy(fixtures.runtimeInstances || [], (item) => item?.definitionId),
    },
  }

  await mkdir(options.outputDir, { recursive: true })
  const outputPath = path.join(options.outputDir, 'latest.json')
  await writeFile(outputPath, `${JSON.stringify(bundle, null, 2)}\n`)

  console.log(JSON.stringify({
    input: options.input,
    outputPath,
    summary: bundle.summary,
    topLevelKeys: objectEntriesSorted(bundle).map(([key]) => key),
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
