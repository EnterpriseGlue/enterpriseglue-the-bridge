import { z } from 'zod';
import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

// Import Starbase schemas
import {
  ProjectSchema,
  CreateProjectRequest,
  RenameProjectRequest,
  FileSchema,
  FileSchemaRaw,
  CreateFileRequest,
  UpdateFileXmlRequest,
  RenameFileRequest,
  VersionSchema,
  CompareVersionsResponse,
  CommentSchema,
  FolderSchema,
  FolderSchemaRaw,
  FolderSummarySchema,
  CreateFolderRequest,
  UpdateFolderRequest,
  ProjectContentsSchema,
  FolderDeletePreviewSchema,
} from '@shared/schemas/starbase/index.js';

// Import Mission Control schemas
import {
  EngineSchema,
  EngineSchemaRaw,
  SavedFilterSchema,
  SavedFilterSchemaRaw,
  BatchSchema,
  ProcessDefinitionSchema as MissionControlProcessDefinitionSchema,
  ProcessDefXmlSchema as MissionControlProcessDefXmlSchema,
  ProcessInstanceSchema as MissionControlProcessInstanceSchema,
  VariablesSchema as MissionControlVariablesSchema,
  ActivityInstanceSchema as MissionControlActivityInstanceSchema,
  PreviewCountRequest,
  // New schemas
  DeploymentSchema,
  DeploymentQueryParams,
  TaskSchema,
  TaskQueryParams,
  ClaimTaskRequest,
  SetAssigneeRequest,
  CompleteTaskRequest,
  TaskVariablesRequest,
  ExternalTaskSchema,
  FetchAndLockRequest,
  CompleteExternalTaskRequest,
  ExternalTaskFailureRequest,
  ExternalTaskBpmnErrorRequest,
  ExtendLockRequest,
  ExternalTaskQueryParams,
  CorrelateMessageRequest,
  MessageCorrelationResultSchema,
  SignalEventSchema,
  DecisionDefinitionSchema,
  DecisionDefinitionQueryParams,
  EvaluateDecisionRequest,
  JobSchema,
  JobDefinitionSchema,
  JobQueryParams,
  JobDefinitionQueryParams,
  SetJobRetriesRequest,
  SetJobSuspensionStateRequest,
  SetJobDefinitionRetriesRequest,
  SetJobDefinitionSuspensionStateRequest,
  HistoricTaskInstanceSchema,
  HistoricVariableInstanceSchema,
  HistoricDecisionInstanceSchema,
  UserOperationLogEntrySchema,
  HistoricTaskQueryParams,
  HistoricVariableQueryParams,
  HistoricDecisionQueryParams,
  UserOperationLogQueryParams,
  MetricSchema,
  MetricsQueryParams,
  // Modify/Restart
  ModificationInstructionSchema,
  ProcessInstanceModificationRequest,
  ProcessDefinitionModificationAsyncRequest,
  ProcessDefinitionRestartAsyncRequest,
} from './mission-control/index.js';

// Import Git schemas
import {
  RepositorySelectSchema,
  InitRepositoryRequestSchema,
  CloneRepositoryRequestSchema,
  DeployRequestSchema,
  RollbackRequestSchema,
  DeploymentResponseSchema,
  AcquireLockRequestSchema,
  LockResponseSchema,
} from '@shared/schemas/git/index.js';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const HealthSchema = z.object({ status: z.literal('ok') });
registry.register('Health', HealthSchema);
registry.registerPath({
  method: 'get',
  path: '/health',
  responses: {
    200: { description: 'Health check', content: { 'application/json': { schema: HealthSchema } } },
  },
});

registry.register('Project', ProjectSchema);
registry.registerPath({
  method: 'get',
  path: '/starbase-api/projects',
  responses: {
    200: {
      description: 'List projects',
      content: { 'application/json': { schema: z.array(ProjectSchema) } },
    },
  },
});

// POST /projects (create project)
registry.register('CreateProjectRequest', CreateProjectRequest);
registry.registerPath({
  method: 'post',
  path: '/starbase-api/projects',
  request: {
    body: { content: { 'application/json': { schema: CreateProjectRequest } } },
  },
  responses: {
    201: {
      description: 'Project created',
      content: { 'application/json': { schema: ProjectSchema } },
    },
  },
});

// PATCH /projects/:projectId (rename project)
registry.register('RenameProjectRequest', RenameProjectRequest);
registry.registerPath({
  method: 'patch',
  path: '/starbase-api/projects/{projectId}',
  request: {
    params: z.object({ projectId: z.string() }),
    body: { content: { 'application/json': { schema: RenameProjectRequest } } },
  },
  responses: {
    200: {
      description: 'Project renamed',
      content: { 'application/json': { schema: z.object({ id: z.string(), name: z.string() }) } },
    },
    404: { description: 'Not found' },
  },
});

// DELETE /projects/:projectId (delete project and cascade files)
registry.registerPath({
  method: 'delete',
  path: '/starbase-api/projects/{projectId}',
  request: { params: z.object({ projectId: z.string() }) },
  responses: {
    204: { description: 'Project deleted' },
    404: { description: 'Not found' },
  },
});

// File schemas
registry.register('File', FileSchema);

// GET /projects/:projectId/files (list, no xml)
registry.registerPath({
  method: 'get',
  path: '/starbase-api/projects/{projectId}/files',
  request: {
    params: z.object({ projectId: z.string() }),
  },
  responses: {
    200: {
      description: 'List files in project',
      content: {
        'application/json': {
          schema: z.array(
            FileSchemaRaw.omit({ xml: true, projectId: true })
          ),
        },
      },
    },
  },
});

// GET /files/:fileId (metadata + xml)
registry.registerPath({
  method: 'get',
  path: '/starbase-api/files/{fileId}',
  request: { params: z.object({ fileId: z.string() }) },
  responses: {
    200: {
      description: 'Get file by id',
      content: { 'application/json': { schema: FileSchema } },
    },
    404: { description: 'Not found' },
  },
});

// POST /projects/:projectId/files (create new BPMN/DMN file)
registry.register('CreateFileRequest', CreateFileRequest);
registry.registerPath({
  method: 'post',
  path: '/starbase-api/projects/{projectId}/files',
  request: {
    params: z.object({ projectId: z.string() }),
    body: { content: { 'application/json': { schema: CreateFileRequest } } },
  },
  responses: {
    201: {
      description: 'File created',
      content: { 'application/json': { schema: FileSchemaRaw.omit({ xml: true, projectId: true }) } },
    },
  },
});

// PUT /files/:fileId (update XML - autosave)
registry.register('UpdateFileXmlRequest', UpdateFileXmlRequest);
registry.registerPath({
  method: 'put',
  path: '/starbase-api/files/{fileId}',
  request: {
    params: z.object({ fileId: z.string() }),
    body: { content: { 'application/json': { schema: UpdateFileXmlRequest } } },
  },
  responses: {
    200: {
      description: 'File XML updated',
      content: { 'application/json': { schema: z.object({ updatedAt: z.number() }) } },
    },
    404: { description: 'Not found' },
    409: {
      description: 'Conflict - file was modified',
      content: { 'application/json': { schema: z.object({ message: z.string(), currentUpdatedAt: z.number() }) } },
    },
  },
});

// PATCH /files/:fileId (rename file)
registry.register('RenameFileRequest', RenameFileRequest);
registry.registerPath({
  method: 'patch',
  path: '/starbase-api/files/{fileId}',
  request: {
    params: z.object({ fileId: z.string() }),
    body: { content: { 'application/json': { schema: RenameFileRequest } } },
  },
  responses: {
    200: {
      description: 'File renamed',
      content: { 'application/json': { schema: z.object({ id: z.string(), name: z.string() }) } },
    },
    404: { description: 'Not found' },
  },
});

// DELETE /files/:fileId (delete file and versions)
registry.registerPath({
  method: 'delete',
  path: '/starbase-api/files/{fileId}',
  request: { params: z.object({ fileId: z.string() }) },
  responses: {
    204: { description: 'File deleted' },
    404: { description: 'Not found' },
  },
});

// GET /files/:fileId/comments (read-only)
registry.register('Comment', CommentSchema);
registry.registerPath({
  method: 'get',
  path: '/starbase-api/files/{fileId}/comments',
  request: { params: z.object({ fileId: z.string() }) },
  responses: {
    200: {
      description: 'List comments for a file',
      content: { 'application/json': { schema: z.array(CommentSchema) } },
    },
  },
});

// Version schemas
registry.register('Version', VersionSchema);

// GET /files/:fileId/versions (list versions for a file)
registry.registerPath({
  method: 'get',
  path: '/starbase-api/files/{fileId}/versions',
  request: { params: z.object({ fileId: z.string() }) },
  responses: {
    200: {
      description: 'List file versions',
      content: { 'application/json': { schema: z.array(VersionSchema) } },
    },
  },
});

// GET /versions/:versionId/compare/:otherVersionId (compare two versions)
registry.register('CompareVersionsResponse', CompareVersionsResponse);
registry.registerPath({
  method: 'get',
  path: '/starbase-api/versions/{versionId}/compare/{otherVersionId}',
  request: {
    params: z.object({
      versionId: z.string(),
      otherVersionId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Version comparison',
      content: { 'application/json': { schema: CompareVersionsResponse } },
    },
  },
});

// -----------------------------
// Starbase API - Deployments (artifact management)
// -----------------------------
registry.register('Deployment', DeploymentSchema);
registry.registerPath({ method: 'get', path: '/starbase-api/deployments', request: { query: DeploymentQueryParams.partial() }, responses: { 200: { description: 'List deployments', content: { 'application/json': { schema: z.array(DeploymentSchema) } } } } });
registry.registerPath({ method: 'get', path: '/starbase-api/deployments/{id}', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'Get deployment', content: { 'application/json': { schema: DeploymentSchema } } }, 404: { description: 'Not found' } } });
registry.registerPath({ method: 'delete', path: '/starbase-api/deployments/{id}', request: { params: z.object({ id: z.string() }), query: z.object({ cascade: z.string().optional() }) }, responses: { 204: { description: 'Deleted' } } });
registry.registerPath({ method: 'get', path: '/starbase-api/process-definitions/{id}/diagram', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'Process diagram', content: { 'application/json': { schema: z.unknown() } } } } });

// -----------------------------
// Mission Control API (Camunda-backed) docs
// -----------------------------
registry.register('MissionControlProcessDefinition', MissionControlProcessDefinitionSchema);
registry.register('MissionControlProcessDefinitionXml', MissionControlProcessDefXmlSchema);
registry.register('MissionControlProcessInstance', MissionControlProcessInstanceSchema);
registry.register('MissionControlVariables', MissionControlVariablesSchema);
registry.register('MissionControlActivityInstance', MissionControlActivityInstanceSchema);

// GET /mission-control-api/process-definitions
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-definitions',
  request: {
    query: z.object({ key: z.string().optional(), nameLike: z.string().optional(), latest: z.string().optional() }),
  },
  responses: {
    200: { description: 'List process definitions', content: { 'application/json': { schema: z.array(MissionControlProcessDefinitionSchema) } } },
  },
});

// GET /mission-control-api/process-definitions/{id}
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-definitions/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Process definition', content: { 'application/json': { schema: MissionControlProcessDefinitionSchema } } },
    404: { description: 'Not found' },
  },
});

// GET /mission-control-api/process-definitions/{id}/xml
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-definitions/{id}/xml',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'BPMN XML', content: { 'application/json': { schema: MissionControlProcessDefXmlSchema } } },
    404: { description: 'Not found' },
  },
});

// GET /mission-control-api/process-definitions/resolve (resolve by key+version)
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-definitions/resolve',
  request: {
    query: z.object({
      key: z.string(),
      version: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Resolved process definition',
      content: { 'application/json': { schema: z.object({ id: z.string() }) } },
    },
  },
});

// GET /mission-control-api/process-definitions/{id}/active-activity-counts
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-definitions/{id}/active-activity-counts',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: 'Active activity counts by activity ID',
      content: { 'application/json': { schema: z.record(z.number()) } },
    },
  },
});

// POST /mission-control-api/process-instances/preview-count (preview count with filters)
registry.register('PreviewCountRequest', PreviewCountRequest);
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/process-instances/preview-count',
  request: {
    body: { content: { 'application/json': { schema: PreviewCountRequest } } },
  },
  responses: {
    200: {
      description: 'Instance count matching filters',
      content: { 'application/json': { schema: z.object({ count: z.number() }) } },
    },
  },
});

// GET /mission-control-api/process-instances
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-instances',
  request: {
    query: z.object({
      processDefinitionKey: z.string().optional(),
      active: z.string().optional(),
      suspended: z.string().optional(),
      withIncidents: z.string().optional(),
      completed: z.string().optional(),
      canceled: z.string().optional(),
    }),
  },
  responses: {
    200: { description: 'List process instances (runtime + historic)', content: { 'application/json': { schema: z.array(MissionControlProcessInstanceSchema) } } },
  },
});

// GET /mission-control-api/process-instances/{id}
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-instances/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Process instance details (runtime)', content: { 'application/json': { schema: z.unknown() } } },
    404: { description: 'Not found' },
  },
});

// GET /mission-control-api/process-instances/{id}/variables
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-instances/{id}/variables',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Process instance variables', content: { 'application/json': { schema: MissionControlVariablesSchema } } },
  },
});

// GET /mission-control-api/process-instances/{id}/history/activity-instances
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-instances/{id}/history/activity-instances',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Historic activity instances', content: { 'application/json': { schema: z.array(MissionControlActivityInstanceSchema) } } },
  },
});

// GET /mission-control-api/process-instances/{id}/incidents
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/process-instances/{id}/incidents',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Incidents for an instance', content: { 'application/json': { schema: z.array(z.unknown()) } } },
  },
});

// PUT /mission-control-api/process-instances/{id}/suspend
registry.registerPath({
  method: 'put',
  path: '/mission-control-api/process-instances/{id}/suspend',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Suspended' },
  },
});

// PUT /mission-control-api/process-instances/{id}/activate
registry.registerPath({
  method: 'put',
  path: '/mission-control-api/process-instances/{id}/activate',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Activated' },
  },
});

// PUT /mission-control-api/process-instances/{id}/retry (retry failed jobs)
registry.registerPath({
  method: 'put',
  path: '/mission-control-api/process-instances/{id}/retry',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: 'Jobs retried',
      content: { 'application/json': { schema: z.object({ retriedJobs: z.number() }) } },
    },
  },
});

// DELETE /mission-control-api/process-instances/{id} (delete instance)
registry.registerPath({
  method: 'delete',
  path: '/mission-control-api/process-instances/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Deleted' },
  },
});

// GET /mission-control-api/history/process-instances (list historic instances)
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/history/process-instances',
  request: {
    query: z.object({
      superProcessInstanceId: z.string().optional(),
      processDefinitionKey: z.string().optional(),
    }).passthrough(),
  },
  responses: {
    200: {
      description: 'List historic process instances',
      content: { 'application/json': { schema: z.array(MissionControlProcessInstanceSchema) } },
    },
  },
});

// GET /mission-control-api/history/process-instances/{id} (get historic instance)
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/history/process-instances/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: 'Historic process instance details',
      content: { 'application/json': { schema: MissionControlProcessInstanceSchema } },
    },
    404: { description: 'Not found' },
  },
});

// GET /mission-control-api/history/variable-instances (historic variables)
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/history/variable-instances',
  request: {
    query: z.object({
      processInstanceId: z.string().optional(),
      variableName: z.string().optional(),
    }).passthrough(),
  },
  responses: {
    200: {
      description: 'Historic variable instances',
      content: { 'application/json': { schema: z.array(z.unknown()) } },
    },
  },
});

// -----------------------------
// Engines API: Engines & Saved Filters
// -----------------------------
registry.register('Engine', EngineSchema)

registry.registerPath({
  method: 'get',
  path: '/engines-api/engines',
  responses: {
    200: { description: 'List engines', content: { 'application/json': { schema: z.array(EngineSchema) } } },
  },
})

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines',
  request: { body: { content: { 'application/json': { schema: EngineSchemaRaw.partial({ id: true, createdAt: true, updatedAt: true }) } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: EngineSchema } } } },
})

registry.registerPath({
  method: 'get',
  path: '/engines-api/engines/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Engine', content: { 'application/json': { schema: EngineSchema } } }, 404: { description: 'Not found' } },
})

registry.registerPath({
  method: 'put',
  path: '/engines-api/engines/{id}',
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: EngineSchemaRaw.partial() } } } },
  responses: { 200: { description: 'Updated', content: { 'application/json': { schema: EngineSchema } } } },
})

registry.registerPath({
  method: 'delete',
  path: '/engines-api/engines/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: 'Deleted' } },
})

// Active engine
registry.registerPath({
  method: 'get',
  path: '/engines-api/engines/active',
  responses: { 200: { description: 'Active engine or null', content: { 'application/json': { schema: EngineSchema.nullable() } } } },
})

// Activate engine
registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{id}/activate',
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Activated engine', content: { 'application/json': { schema: EngineSchema } } } },
})

// Engine health
const EngineHealthSchema = z.object({
  id: z.string().optional(),
  engineId: z.string().optional(),
  status: z.enum(['connected','disconnected','unknown']),
  latencyMs: z.number().nullable().optional(),
  message: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  checkedAt: z.number(),
})
registry.register('EngineHealth', EngineHealthSchema)

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{id}/test',
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Health test result', content: { 'application/json': { schema: EngineHealthSchema } } } },
})

registry.registerPath({
  method: 'get',
  path: '/engines-api/engines/{id}/health',
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Last recorded health or null', content: { 'application/json': { schema: EngineHealthSchema.nullable() } } } },
})

registry.register('SavedFilter', SavedFilterSchema)

registry.registerPath({
  method: 'get',
  path: '/engines-api/saved-filters',
  responses: { 200: { description: 'List saved filters', content: { 'application/json': { schema: z.array(SavedFilterSchema) } } } },
})

registry.registerPath({
  method: 'post',
  path: '/engines-api/saved-filters',
  request: { body: { content: { 'application/json': { schema: SavedFilterSchemaRaw.partial({ id: true, createdAt: true }) } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: SavedFilterSchema } } } },
})

registry.registerPath({
  method: 'get',
  path: '/engines-api/saved-filters/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Saved filter', content: { 'application/json': { schema: SavedFilterSchema } } }, 404: { description: 'Not found' } },
})

registry.registerPath({
  method: 'put',
  path: '/engines-api/saved-filters/{id}',
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: SavedFilterSchemaRaw.partial() } } } },
  responses: { 200: { description: 'Updated', content: { 'application/json': { schema: SavedFilterSchema } } } },
})

registry.registerPath({
  method: 'delete',
  path: '/engines-api/saved-filters/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: 'Deleted' } },
})

// -----------------------------
// Engines API - Deployments (Camunda 7 passthrough)
// -----------------------------
const DeployResources = z.object({
  fileIds: z.array(z.string()).optional(),
  folderId: z.string().optional(),
  projectId: z.string().optional(),
  recursive: z.boolean().optional(),
})
const DeployOptions = z.object({
  deploymentName: z.string().optional(),
  enableDuplicateFiltering: z.boolean().optional(),
  deployChangedOnly: z.boolean().optional(),
  tenantId: z.string().optional(),
})
const DeployRequest = z.object({ resources: DeployResources.optional(), options: DeployOptions.optional() })
const PreviewResponse = z.object({ count: z.number(), resources: z.array(z.string()), warnings: z.array(z.string()), errors: z.array(z.string()) })
const DeployResponse = z.object({ engineId: z.string(), engineBaseUrl: z.string(), raw: z.unknown() })

registry.register('EnginesDeployRequest', DeployRequest)
registry.register('EnginesDeployPreviewResponse', PreviewResponse)
registry.register('EnginesDeployResponse', DeployResponse)

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{engineId}/deployments/preview',
  request: { params: z.object({ engineId: z.string() }), body: { content: { 'application/json': { schema: DeployRequest } } } },
  responses: { 200: { description: 'Preview of resources to deploy', content: { 'application/json': { schema: PreviewResponse } } } },
})

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{engineId}/deployments',
  request: { params: z.object({ engineId: z.string() }), body: { content: { 'application/json': { schema: DeployRequest } } } },
  responses: { 201: { description: 'Deployment created', content: { 'application/json': { schema: DeployResponse } } } },
})

registry.registerPath({
  method: 'get',
  path: '/engines-api/engines/{engineId}/deployments',
  request: { params: z.object({ engineId: z.string() }) },
  responses: { 200: { description: 'List engine deployments (raw engine shape)', content: { 'application/json': { schema: z.unknown() } } } },
})

registry.registerPath({
  method: 'get',
  path: '/engines-api/engines/{engineId}/deployments/{id}',
  request: { params: z.object({ engineId: z.string(), id: z.string() }) },
  responses: { 200: { description: 'Engine deployment detail (raw engine shape)', content: { 'application/json': { schema: z.unknown() } } }, 404: { description: 'Not found' } },
})

registry.registerPath({
  method: 'delete',
  path: '/engines-api/engines/{engineId}/deployments/{id}',
  request: { params: z.object({ engineId: z.string(), id: z.string() }) },
  responses: { 204: { description: 'Deleted' } },
})

// -----------------------------
// Batches (async operations)
// -----------------------------
registry.register('Batch', BatchSchema)

const CreateBatchResponse = z.object({ id: z.string(), camundaBatchId: z.string().optional(), type: z.string() })
registry.register('CreateBatchResponse', CreateBatchResponse)

const CreateDeleteBatchRequest = z.object({
  processInstanceIds: z.array(z.string()).optional(),
  processInstanceQuery: z.record(z.any()).optional(),
  deleteReason: z.string().optional(),
  skipCustomListeners: z.boolean().optional(),
  skipIoMappings: z.boolean().optional(),
  failIfNotExists: z.boolean().optional(),
  skipSubprocesses: z.boolean().optional(),
})
registry.register('CreateDeleteBatchRequest', CreateDeleteBatchRequest)

const CreateSuspendActivateBatchRequest = z.object({
  processInstanceIds: z.array(z.string()).optional(),
  processInstanceQuery: z.record(z.any()).optional(),
  suspended: z.boolean().optional(),
})
registry.register('CreateSuspendActivateBatchRequest', CreateSuspendActivateBatchRequest)

const CreateRetriesBatchRequest = z.object({
  retries: z.number().min(0),
  jobIds: z.array(z.string()).optional(),
  processInstanceIds: z.array(z.string()).optional(),
})
registry.register('CreateRetriesBatchRequest', CreateRetriesBatchRequest)

const BatchDetailSchema = z.object({
  batch: BatchSchema,
  engine: z.unknown().nullable().optional(),
  statistics: z.unknown().nullable().optional(),
})
registry.register('BatchDetail', BatchDetailSchema)

// Create: delete instances (async)
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/batches/process-instances/delete',
  request: { body: { content: { 'application/json': { schema: CreateDeleteBatchRequest } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: CreateBatchResponse } } } },
})

// Create: suspend instances (async)
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/batches/process-instances/suspend',
  request: { body: { content: { 'application/json': { schema: CreateSuspendActivateBatchRequest } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: CreateBatchResponse } } } },
})

// Create: activate instances (async)
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/batches/process-instances/activate',
  request: { body: { content: { 'application/json': { schema: CreateSuspendActivateBatchRequest } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: CreateBatchResponse } } } },
})

// Create: set job retries (async)
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/batches/jobs/retries',
  request: { body: { content: { 'application/json': { schema: CreateRetriesBatchRequest } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: CreateBatchResponse } } } },
})

// List batches
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/batches',
  responses: { 200: { description: 'List batches', content: { 'application/json': { schema: z.array(BatchSchema) } } } },
})

// Batch detail
registry.registerPath({
  method: 'get',
  path: '/mission-control-api/batches/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'Batch detail', content: { 'application/json': { schema: BatchDetailSchema } } }, 404: { description: 'Not found' } },
})

// Cancel batch
registry.registerPath({
  method: 'delete',
  path: '/mission-control-api/batches/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: 'Canceled' }, 404: { description: 'Not found' } },
})
// -----------------------------
// Migration (async batch)
// -----------------------------
const MigrationInstructionSchema = z.object({
  sourceActivityIds: z.array(z.string()),
  targetActivityId: z.string(),
  updateEventTrigger: z.boolean().optional(),
})
const MigrationPlanSchema = z.object({
  sourceProcessDefinitionId: z.string(),
  targetProcessDefinitionId: z.string(),
  instructions: z.array(MigrationInstructionSchema).default([]),
  updateEventTriggers: z.boolean().optional(),
})
registry.register('MigrationPlan', MigrationPlanSchema)

const MigrationGenerateInput = z.object({
  sourceDefinitionId: z.string(),
  targetDefinitionId: z.string(),
  updateEventTriggers: z.boolean().optional(),
  overrides: z
    .array(
      z.object({
        sourceActivityIds: z.array(z.string()).optional(),
        sourceActivityId: z.string().optional(),
        targetActivityId: z.string().optional(),
        targetActivityIds: z.array(z.string()).optional(),
        updateEventTrigger: z.boolean().optional(),
      })
    )
    .optional(),
})
registry.register('MigrationGenerateInput', MigrationGenerateInput)

const MigrationValidateRequest = z.object({ plan: MigrationPlanSchema })
registry.register('MigrationValidateRequest', MigrationValidateRequest)

const MigrationExecuteRequest = z.object({
  plan: MigrationPlanSchema,
  processInstanceIds: z.array(z.string()).optional(),
  skipCustomListeners: z.boolean().optional(),
  skipIoMappings: z.boolean().optional(),
  variables: MissionControlVariablesSchema.optional(),
})
registry.register('MigrationExecuteRequest', MigrationExecuteRequest)

const MigrationCreateResponse = z.object({ id: z.string(), camundaBatchId: z.string().optional(), type: z.literal('MIGRATE_INSTANCES') })
registry.register('MigrationCreateResponse', MigrationCreateResponse)

const MigrationDirectResponse = z.object({ ok: z.boolean() })
registry.register('MigrationDirectResponse', MigrationDirectResponse)

// POST /mission-control-api/migration/plan/generate
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/migration/plan/generate',
  request: { body: { content: { 'application/json': { schema: MigrationGenerateInput } } } },
  responses: { 200: { description: 'Generated migration plan (engine shape)', content: { 'application/json': { schema: MigrationPlanSchema } } } },
})

// POST /mission-control-api/migration/plan/validate
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/migration/plan/validate',
  request: { body: { content: { 'application/json': { schema: MigrationValidateRequest } } } },
  responses: { 200: { description: 'Validation result', content: { 'application/json': { schema: z.unknown() } } } },
})

// POST /mission-control-api/migration/execute-async
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/migration/execute-async',
  request: { body: { content: { 'application/json': { schema: MigrationExecuteRequest } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: MigrationCreateResponse } } } },
})

// POST /mission-control-api/migration/execute-direct
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/migration/execute-direct',
  request: { body: { content: { 'application/json': { schema: MigrationExecuteRequest } } } },
  responses: { 200: { description: 'Executed', content: { 'application/json': { schema: MigrationDirectResponse } } } },
})

// POST /mission-control-api/migration/preview
const MigrationPreviewRequest = z.object({ plan: MigrationPlanSchema.optional(), processInstanceIds: z.array(z.string()).optional() })
const MigrationPreviewResponse = z.object({ count: z.number() })
registry.register('MigrationPreviewRequest', MigrationPreviewRequest)
registry.register('MigrationPreviewResponse', MigrationPreviewResponse)
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/migration/preview',
  request: { body: { content: { 'application/json': { schema: MigrationPreviewRequest } } } },
  responses: { 200: { description: 'Preview affected instances count', content: { 'application/json': { schema: MigrationPreviewResponse } } } },
})

// POST /mission-control-api/migration/active-sources
const ActiveSourcesRequest = z.object({ processInstanceIds: z.array(z.string()) })
const ActiveSourcesResponse = z.record(z.number())
registry.register('ActiveSourcesRequest', ActiveSourcesRequest)
registry.register('ActiveSourcesResponse', ActiveSourcesResponse)
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/migration/active-sources',
  request: { body: { content: { 'application/json': { schema: ActiveSourcesRequest } } } },
  responses: { 200: { description: 'Active source activity counts keyed by activityId', content: { 'application/json': { schema: ActiveSourcesResponse } } } },
})

// -----------------------------
// Direct operations (no batch)
// -----------------------------
const DirectIds = z.object({ processInstanceIds: z.array(z.string()), skipCustomListeners: z.boolean().optional(), skipIoMappings: z.boolean().optional(), failIfNotExists: z.boolean().optional(), skipSubprocesses: z.boolean().optional() })
const DirectSuspend = z.object({ processInstanceIds: z.array(z.string()) })
const DirectRetries = z.object({ processInstanceIds: z.array(z.string()), retries: z.number().min(0), onlyFailed: z.boolean().optional() })
const DirectResult = z.object({ total: z.number(), succeeded: z.array(z.string()), failed: z.array(z.object({ id: z.string(), ok: z.boolean(), error: z.string().optional() })) })

registry.registerPath({ method: 'post', path: '/mission-control-api/direct/process-instances/delete', request: { body: { content: { 'application/json': { schema: DirectIds } } } }, responses: { 200: { description: 'Result', content: { 'application/json': { schema: DirectResult } } } } })
registry.registerPath({ method: 'post', path: '/mission-control-api/direct/process-instances/suspend', request: { body: { content: { 'application/json': { schema: DirectSuspend } } } }, responses: { 200: { description: 'Result', content: { 'application/json': { schema: DirectResult } } } } })
registry.registerPath({ method: 'post', path: '/mission-control-api/direct/process-instances/activate', request: { body: { content: { 'application/json': { schema: DirectSuspend } } } }, responses: { 200: { description: 'Result', content: { 'application/json': { schema: DirectResult } } } } })
registry.registerPath({ method: 'post', path: '/mission-control-api/direct/jobs/retries', request: { body: { content: { 'application/json': { schema: DirectRetries } } } }, responses: { 200: { description: 'Result', content: { 'application/json': { schema: DirectResult } } } } })

// -----------------------------
// Mission Control API - Extended Endpoints
// -----------------------------

// Tasks
registry.register('Task', TaskSchema);
registry.registerPath({ method: 'get', path: '/mission-control-api/tasks', request: { query: TaskQueryParams.partial() }, responses: { 200: { description: 'Query tasks', content: { 'application/json': { schema: z.array(TaskSchema) } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/tasks/count', request: { query: TaskQueryParams.partial() }, responses: { 200: { description: 'Count tasks', content: { 'application/json': { schema: z.object({ count: z.number() }) } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/tasks/{id}', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'Get task', content: { 'application/json': { schema: TaskSchema } } }, 404: { description: 'Not found' } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/tasks/{id}/variables', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'Task variables', content: { 'application/json': { schema: MissionControlVariablesSchema } } } } });
registry.registerPath({ method: 'put', path: '/mission-control-api/tasks/{id}/variables', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: TaskVariablesRequest } } } }, responses: { 200: { description: 'Variables updated', content: { 'application/json': { schema: z.unknown() } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/tasks/{id}/form', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'Task form', content: { 'application/json': { schema: z.unknown() } } } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/tasks/{id}/claim', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: ClaimTaskRequest } } } }, responses: { 204: { description: 'Claimed' } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/tasks/{id}/unclaim', request: { params: z.object({ id: z.string() }) }, responses: { 204: { description: 'Unclaimed' } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/tasks/{id}/assignee', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: SetAssigneeRequest } } } }, responses: { 204: { description: 'Assignee set' } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/tasks/{id}/complete', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: CompleteTaskRequest.partial() } } } }, responses: { 200: { description: 'Task completed', content: { 'application/json': { schema: z.unknown() } } } } });

// External Tasks
registry.register('ExternalTask', ExternalTaskSchema);
registry.registerPath({ method: 'post', path: '/mission-control-api/external-tasks/fetchAndLock', request: { body: { content: { 'application/json': { schema: FetchAndLockRequest } } } }, responses: { 200: { description: 'Locked external tasks', content: { 'application/json': { schema: z.array(ExternalTaskSchema) } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/external-tasks', request: { query: ExternalTaskQueryParams.partial() }, responses: { 200: { description: 'Query external tasks', content: { 'application/json': { schema: z.array(ExternalTaskSchema) } } } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/external-tasks/{id}/complete', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: CompleteExternalTaskRequest } } } }, responses: { 204: { description: 'Completed' } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/external-tasks/{id}/failure', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: ExternalTaskFailureRequest } } } }, responses: { 204: { description: 'Failure reported' } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/external-tasks/{id}/bpmnError', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: ExternalTaskBpmnErrorRequest } } } }, responses: { 204: { description: 'BPMN error reported' } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/external-tasks/{id}/extendLock', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: ExtendLockRequest } } } }, responses: { 204: { description: 'Lock extended' } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/external-tasks/{id}/unlock', request: { params: z.object({ id: z.string() }) }, responses: { 204: { description: 'Unlocked' } } });

// Messages & Signals
registry.register('MessageCorrelationResult', MessageCorrelationResultSchema);
registry.registerPath({ method: 'post', path: '/mission-control-api/messages', request: { body: { content: { 'application/json': { schema: CorrelateMessageRequest } } } }, responses: { 200: { description: 'Message correlated', content: { 'application/json': { schema: MessageCorrelationResultSchema } } } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/signals', request: { body: { content: { 'application/json': { schema: SignalEventSchema } } } }, responses: { 204: { description: 'Signal delivered' } } });

// Decisions
registry.register('DecisionDefinition', DecisionDefinitionSchema);
registry.registerPath({ method: 'get', path: '/mission-control-api/decision-definitions', request: { query: DecisionDefinitionQueryParams.partial() }, responses: { 200: { description: 'List decision definitions', content: { 'application/json': { schema: z.array(DecisionDefinitionSchema) } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/decision-definitions/{id}', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'Get decision definition', content: { 'application/json': { schema: DecisionDefinitionSchema } } }, 404: { description: 'Not found' } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/decision-definitions/{id}/xml', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'DMN XML', content: { 'application/json': { schema: z.object({ dmnXml: z.string() }) } } } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/decision-definitions/{id}/evaluate', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: EvaluateDecisionRequest } } } }, responses: { 200: { description: 'Decision result', content: { 'application/json': { schema: z.array(z.unknown()) } } } } });

// Jobs
registry.register('Job', JobSchema);
registry.register('JobDefinition', JobDefinitionSchema);
registry.registerPath({ method: 'get', path: '/mission-control-api/jobs', request: { query: JobQueryParams.partial() }, responses: { 200: { description: 'Query jobs', content: { 'application/json': { schema: z.array(JobSchema) } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/jobs/{id}', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'Get job', content: { 'application/json': { schema: JobSchema } } }, 404: { description: 'Not found' } } });
registry.registerPath({ method: 'post', path: '/mission-control-api/jobs/{id}/execute', request: { params: z.object({ id: z.string() }) }, responses: { 204: { description: 'Job executed' } } });
registry.registerPath({ method: 'put', path: '/mission-control-api/jobs/{id}/retries', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: SetJobRetriesRequest } } } }, responses: { 204: { description: 'Retries set' } } });
registry.registerPath({ method: 'put', path: '/mission-control-api/jobs/{id}/suspended', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: SetJobSuspensionStateRequest } } } }, responses: { 204: { description: 'Suspension state updated' } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/job-definitions', request: { query: JobDefinitionQueryParams.partial() }, responses: { 200: { description: 'Query job definitions', content: { 'application/json': { schema: z.array(JobDefinitionSchema) } } } } });
registry.registerPath({ method: 'put', path: '/mission-control-api/job-definitions/{id}/retries', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: SetJobDefinitionRetriesRequest } } } }, responses: { 204: { description: 'Retries set' } } });
registry.registerPath({ method: 'put', path: '/mission-control-api/job-definitions/{id}/suspended', request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: SetJobDefinitionSuspensionStateRequest } } } }, responses: { 204: { description: 'Suspension state updated' } } });

// Extended History
registry.register('HistoricTaskInstance', HistoricTaskInstanceSchema);
registry.register('HistoricVariableInstance', HistoricVariableInstanceSchema);
registry.register('HistoricDecisionInstance', HistoricDecisionInstanceSchema);
registry.register('UserOperationLogEntry', UserOperationLogEntrySchema);
registry.registerPath({ method: 'get', path: '/mission-control-api/history/tasks', request: { query: HistoricTaskQueryParams.partial() }, responses: { 200: { description: 'Historic task instances', content: { 'application/json': { schema: z.array(HistoricTaskInstanceSchema) } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/history/variables', request: { query: HistoricVariableQueryParams.partial() }, responses: { 200: { description: 'Historic variable instances', content: { 'application/json': { schema: z.array(HistoricVariableInstanceSchema) } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/history/decisions', request: { query: HistoricDecisionQueryParams.partial() }, responses: { 200: { description: 'Historic decision instances', content: { 'application/json': { schema: z.array(HistoricDecisionInstanceSchema) } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/history/decisions/{id}/inputs', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'Inputs for a historic decision instance', content: { 'application/json': { schema: z.array(z.unknown()) } } }, 404: { description: 'Not found' } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/history/decisions/{id}/outputs', request: { params: z.object({ id: z.string() }) }, responses: { 200: { description: 'Outputs for a historic decision instance', content: { 'application/json': { schema: z.array(z.unknown()) } } }, 404: { description: 'Not found' } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/history/user-operations', request: { query: UserOperationLogQueryParams.partial() }, responses: { 200: { description: 'User operation log', content: { 'application/json': { schema: z.array(UserOperationLogEntrySchema) } } } } });

// Metrics
registry.register('Metric', MetricSchema);
registry.registerPath({ method: 'get', path: '/mission-control-api/metrics', request: { query: MetricsQueryParams.partial() }, responses: { 200: { description: 'Query metrics', content: { 'application/json': { schema: z.array(MetricSchema) } } } } });
registry.registerPath({ method: 'get', path: '/mission-control-api/metrics/{name}', request: { params: z.object({ name: z.string() }), query: MetricsQueryParams.partial() }, responses: { 200: { description: 'Get metric by name', content: { 'application/json': { schema: z.array(MetricSchema) } } } } });

// -----------------------------
// Modification & Restart
// -----------------------------
registry.register('ModificationInstruction', ModificationInstructionSchema)
registry.register('ProcessInstanceModificationRequest', ProcessInstanceModificationRequest)
registry.register('ProcessDefinitionModificationAsyncRequest', ProcessDefinitionModificationAsyncRequest)
registry.register('ProcessDefinitionRestartAsyncRequest', ProcessDefinitionRestartAsyncRequest)

// POST /mission-control-api/process-instances/{id}/modify
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/process-instances/{id}/modify',
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: ProcessInstanceModificationRequest } } } },
  responses: { 204: { description: 'Modified' } },
})

// POST /mission-control-api/process-definitions/{id}/modification/execute-async
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/process-definitions/{id}/modification/execute-async',
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: ProcessDefinitionModificationAsyncRequest } } } },
  responses: { 201: { description: 'Batch created', content: { 'application/json': { schema: z.object({ id: z.string(), camundaBatchId: z.string().optional(), type: z.literal('MODIFY_INSTANCES') }) } } } },
})

// POST /mission-control-api/process-definitions/{id}/restart/execute-async
registry.registerPath({
  method: 'post',
  path: '/mission-control-api/process-definitions/{id}/restart/execute-async',
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: ProcessDefinitionRestartAsyncRequest } } } },
  responses: { 201: { description: 'Batch created', content: { 'application/json': { schema: z.object({ id: z.string(), camundaBatchId: z.string().optional(), type: z.literal('RESTART_INSTANCES') }) } } } },
})

// -----------------------------
// Git Versioning API
// -----------------------------

// Register Git schemas
registry.register('Repository', RepositorySelectSchema);
registry.register('InitRepositoryRequest', InitRepositoryRequestSchema);
registry.register('CloneRepositoryRequest', CloneRepositoryRequestSchema);
registry.register('DeployRequest', DeployRequestSchema);
registry.register('RollbackRequest', RollbackRequestSchema);
registry.register('DeploymentResponse', DeploymentResponseSchema);
registry.register('AcquireLockRequest', AcquireLockRequestSchema);
registry.register('LockResponse', LockResponseSchema);

// POST /git-api/repositories/init (initialize new repository)
registry.registerPath({
  method: 'post',
  path: '/git-api/repositories/init',
  request: { body: { content: { 'application/json': { schema: InitRepositoryRequestSchema } } } },
  responses: { 
    201: { description: 'Repository initialized', content: { 'application/json': { schema: RepositorySelectSchema } } },
    403: { description: 'Forbidden' },
  },
});

// POST /git-api/repositories/clone (clone existing repository)
registry.registerPath({
  method: 'post',
  path: '/git-api/repositories/clone',
  request: { body: { content: { 'application/json': { schema: CloneRepositoryRequestSchema } } } },
  responses: { 
    201: { description: 'Repository cloned', content: { 'application/json': { schema: RepositorySelectSchema } } },
    403: { description: 'Forbidden' },
  },
});

// GET /git-api/repositories (list user repositories)
registry.registerPath({
  method: 'get',
  path: '/git-api/repositories',
  responses: { 
    200: { description: 'List of repositories', content: { 'application/json': { schema: z.array(RepositorySelectSchema) } } },
  },
});

// GET /git-api/repositories/:id (get repository details)
registry.registerPath({
  method: 'get',
  path: '/git-api/repositories/{id}',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 
    200: { description: 'Repository details', content: { 'application/json': { schema: RepositorySelectSchema } } },
    404: { description: 'Repository not found' },
  },
});

// DELETE /git-api/repositories/:id (delete repository)
registry.registerPath({
  method: 'delete',
  path: '/git-api/repositories/{id}',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 
    204: { description: 'Repository deleted' },
    404: { description: 'Repository not found' },
  },
});

// POST /git-api/deploy (deploy project)
registry.registerPath({
  method: 'post',
  path: '/git-api/deploy',
  request: { body: { content: { 'application/json': { schema: DeployRequestSchema } } } },
  responses: { 
    201: { description: 'Deployment successful', content: { 'application/json': { schema: DeploymentResponseSchema } } },
    403: { description: 'Forbidden' },
  },
});

// POST /git-api/rollback (rollback to commit)
registry.registerPath({
  method: 'post',
  path: '/git-api/rollback',
  request: { body: { content: { 'application/json': { schema: RollbackRequestSchema } } } },
  responses: { 
    200: { description: 'Rollback successful', content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string() }) } } },
    403: { description: 'Forbidden' },
  },
});

// GET /git-api/commits (get commit history)
registry.registerPath({
  method: 'get',
  path: '/git-api/commits',
  request: { query: z.object({ projectId: z.string().uuid(), limit: z.string().optional() }) },
  responses: { 
    200: { description: 'Commit history', content: { 'application/json': { schema: z.unknown() } } },
    400: { description: 'Bad request' },
  },
});

// POST /git-api/locks (acquire file lock)
registry.registerPath({
  method: 'post',
  path: '/git-api/locks',
  request: { body: { content: { 'application/json': { schema: AcquireLockRequestSchema } } } },
  responses: { 
    201: { description: 'Lock acquired', content: { 'application/json': { schema: LockResponseSchema } } },
    409: { description: 'File locked by another user' },
  },
});

// DELETE /git-api/locks/:lockId (release lock)
registry.registerPath({
  method: 'delete',
  path: '/git-api/locks/{lockId}',
  request: { params: z.object({ lockId: z.string().uuid() }) },
  responses: { 
    204: { description: 'Lock released' },
  },
});

// GET /git-api/locks (list active locks)
registry.registerPath({
  method: 'get',
  path: '/git-api/locks',
  request: { query: z.object({ projectId: z.string().uuid() }) },
  responses: { 
    200: { description: 'Active locks', content: { 'application/json': { schema: z.object({ locks: z.array(LockResponseSchema) }) } } },
    400: { description: 'Bad request' },
  },
});

// -----------------------------
// Platform Admin API
// -----------------------------
import {
  EnvironmentTagSchema,
  CreateEnvironmentTagRequest,
  UpdateEnvironmentTagRequest,
  ReorderEnvironmentTagsRequest,
  PlatformSettingsSchema,
  UpdatePlatformSettingsRequest,
  ProjectMemberSchema,
  AddProjectMemberRequest,
  UpdateProjectMemberRoleRequest,
  TransferProjectOwnershipRequest,
  EngineMemberSchema,
  EngineWithDetailsSchema,
  EngineRoleResponse,
  AddEngineMemberRequest,
  UpdateEngineMemberRoleRequest,
  AssignDelegateRequest,
  TransferEngineOwnershipRequest,
  SetEnvironmentRequest,
  SetLockedRequest,
  RequestAccessRequest,
  AssignOwnerRequest,
  UserSearchResultSchema,
  UserListItemSchema,
  SuccessResponseSchema,
} from '@shared/schemas/platform-admin/index.js';

// Environment Tags
registry.register('EnvironmentTag', EnvironmentTagSchema);
registry.registerPath({
  method: 'get',
  path: '/api/admin/environments',
  responses: { 200: { description: 'List environment tags', content: { 'application/json': { schema: z.array(EnvironmentTagSchema) } } } },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/environments',
  request: { body: { content: { 'application/json': { schema: CreateEnvironmentTagRequest } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: EnvironmentTagSchema } } } },
});

registry.registerPath({
  method: 'put',
  path: '/api/admin/environments/{id}',
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: UpdateEnvironmentTagRequest } } } },
  responses: { 200: { description: 'Updated', content: { 'application/json': { schema: SuccessResponseSchema } } } },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/environments/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: 'Deleted' }, 400: { description: 'In use' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/environments/reorder',
  request: { body: { content: { 'application/json': { schema: ReorderEnvironmentTagsRequest } } } },
  responses: { 200: { description: 'Reordered', content: { 'application/json': { schema: SuccessResponseSchema } } } },
});

// Platform Settings
registry.register('PlatformSettings', PlatformSettingsSchema);
registry.registerPath({
  method: 'get',
  path: '/api/admin/settings',
  responses: { 200: { description: 'Platform settings', content: { 'application/json': { schema: PlatformSettingsSchema } } } },
});

registry.registerPath({
  method: 'put',
  path: '/api/admin/settings',
  request: { body: { content: { 'application/json': { schema: UpdatePlatformSettingsRequest } } } },
  responses: { 200: { description: 'Updated', content: { 'application/json': { schema: SuccessResponseSchema } } } },
});

// Admin Governance
registry.registerPath({
  method: 'post',
  path: '/api/admin/projects/{projectId}/assign-owner',
  request: { params: z.object({ projectId: z.string().uuid() }), body: { content: { 'application/json': { schema: AssignOwnerRequest } } } },
  responses: { 200: { description: 'Owner assigned', content: { 'application/json': { schema: SuccessResponseSchema } } } },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/engines/{engineId}/assign-owner',
  request: { params: z.object({ engineId: z.string() }), body: { content: { 'application/json': { schema: AssignOwnerRequest } } } },
  responses: { 200: { description: 'Owner assigned', content: { 'application/json': { schema: SuccessResponseSchema } } } },
});

// Admin Users
registry.register('UserSearchResult', UserSearchResultSchema);
registry.register('UserListItem', UserListItemSchema);
registry.registerPath({
  method: 'get',
  path: '/api/admin/users/search',
  request: { query: z.object({ q: z.string() }) },
  responses: { 200: { description: 'Search results', content: { 'application/json': { schema: z.array(UserSearchResultSchema) } } } },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/users',
  request: { query: z.object({ limit: z.string().optional(), offset: z.string().optional() }) },
  responses: { 200: { description: 'User list', content: { 'application/json': { schema: z.array(UserListItemSchema) } } } },
});

// -----------------------------
// Project Members API
// -----------------------------
registry.register('ProjectMember', ProjectMemberSchema);
registry.registerPath({
  method: 'get',
  path: '/starbase-api/projects/{projectId}/members',
  request: { params: z.object({ projectId: z.string().uuid() }) },
  responses: { 200: { description: 'Project members', content: { 'application/json': { schema: z.array(ProjectMemberSchema) } } } },
});

registry.registerPath({
  method: 'post',
  path: '/starbase-api/projects/{projectId}/members',
  request: { params: z.object({ projectId: z.string().uuid() }), body: { content: { 'application/json': { schema: AddProjectMemberRequest } } } },
  responses: { 201: { description: 'Member added', content: { 'application/json': { schema: ProjectMemberSchema } } } },
});

registry.registerPath({
  method: 'patch',
  path: '/starbase-api/projects/{projectId}/members/{userId}',
  request: { params: z.object({ projectId: z.string().uuid(), userId: z.string().uuid() }), body: { content: { 'application/json': { schema: UpdateProjectMemberRoleRequest } } } },
  responses: { 200: { description: 'Role updated', content: { 'application/json': { schema: z.object({ message: z.string() }) } } } },
});

registry.registerPath({
  method: 'delete',
  path: '/starbase-api/projects/{projectId}/members/{userId}',
  request: { params: z.object({ projectId: z.string().uuid(), userId: z.string().uuid() }) },
  responses: { 204: { description: 'Member removed' } },
});

registry.registerPath({
  method: 'post',
  path: '/starbase-api/projects/{projectId}/transfer-ownership',
  request: { params: z.object({ projectId: z.string().uuid() }), body: { content: { 'application/json': { schema: TransferProjectOwnershipRequest } } } },
  responses: { 200: { description: 'Ownership transferred', content: { 'application/json': { schema: z.object({ message: z.string() }) } } } },
});

registry.registerPath({
  method: 'get',
  path: '/starbase-api/projects/{projectId}/members/me',
  request: { params: z.object({ projectId: z.string().uuid() }) },
  responses: { 200: { description: 'My membership', content: { 'application/json': { schema: ProjectMemberSchema.nullable() } } } },
});

// -----------------------------
// Engine Management API
// -----------------------------
registry.register('EngineMember', EngineMemberSchema);
registry.register('EngineWithDetails', EngineWithDetailsSchema);

registry.registerPath({
  method: 'get',
  path: '/engines-api/my-engines',
  responses: { 200: { description: 'Engines user has access to', content: { 'application/json': { schema: z.array(EngineWithDetailsSchema) } } } },
});

registry.registerPath({
  method: 'get',
  path: '/engines-api/engines/{engineId}/my-role',
  request: { params: z.object({ engineId: z.string() }) },
  responses: { 200: { description: 'My role on engine', content: { 'application/json': { schema: EngineRoleResponse } } } },
});

registry.registerPath({
  method: 'get',
  path: '/engines-api/engines/{engineId}/members',
  request: { params: z.object({ engineId: z.string() }) },
  responses: { 200: { description: 'Engine members', content: { 'application/json': { schema: z.array(EngineMemberSchema) } } } },
});

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{engineId}/members',
  request: { params: z.object({ engineId: z.string() }), body: { content: { 'application/json': { schema: AddEngineMemberRequest } } } },
  responses: { 201: { description: 'Member added', content: { 'application/json': { schema: EngineMemberSchema } } } },
});

registry.registerPath({
  method: 'patch',
  path: '/engines-api/engines/{engineId}/members/{userId}',
  request: { params: z.object({ engineId: z.string(), userId: z.string().uuid() }), body: { content: { 'application/json': { schema: UpdateEngineMemberRoleRequest } } } },
  responses: { 200: { description: 'Role updated', content: { 'application/json': { schema: z.object({ message: z.string() }) } } } },
});

registry.registerPath({
  method: 'delete',
  path: '/engines-api/engines/{engineId}/members/{userId}',
  request: { params: z.object({ engineId: z.string(), userId: z.string().uuid() }) },
  responses: { 204: { description: 'Member removed' } },
});

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{engineId}/delegate',
  request: { params: z.object({ engineId: z.string() }), body: { content: { 'application/json': { schema: AssignDelegateRequest } } } },
  responses: { 200: { description: 'Delegate assigned', content: { 'application/json': { schema: z.object({ message: z.string() }) } } } },
});

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{engineId}/transfer-ownership',
  request: { params: z.object({ engineId: z.string() }), body: { content: { 'application/json': { schema: TransferEngineOwnershipRequest } } } },
  responses: { 200: { description: 'Ownership transferred', content: { 'application/json': { schema: z.object({ message: z.string() }) } } } },
});

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{engineId}/environment',
  request: { params: z.object({ engineId: z.string() }), body: { content: { 'application/json': { schema: SetEnvironmentRequest } } } },
  responses: { 200: { description: 'Environment set', content: { 'application/json': { schema: z.object({ message: z.string() }) } } } },
});

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{engineId}/lock',
  request: { params: z.object({ engineId: z.string() }), body: { content: { 'application/json': { schema: SetLockedRequest } } } },
  responses: { 200: { description: 'Lock state changed', content: { 'application/json': { schema: z.object({ message: z.string() }) } } } },
});

registry.registerPath({
  method: 'post',
  path: '/engines-api/engines/{engineId}/request-access',
  request: { params: z.object({ engineId: z.string() }), body: { content: { 'application/json': { schema: RequestAccessRequest } } } },
  responses: { 200: { description: 'Access request result', content: { 'application/json': { schema: z.object({ status: z.string(), autoApproved: z.boolean().optional(), requestId: z.string().optional() }) } } } },
});

export function generateOpenApi() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: { title: 'Voyager API', version: '0.1.0' },
  });
}
