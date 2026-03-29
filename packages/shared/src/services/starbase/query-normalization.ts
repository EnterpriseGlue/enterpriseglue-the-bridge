import type { EngineDeployment } from '@enterpriseglue/shared/db/entities/EngineDeployment.js';

export interface QueryArtifactSummary {
  kind: string;
  key: string;
  version: number;
  id: string;
}

export interface QueryArtifactRawRow {
  artifactKind?: unknown;
  artifactKey?: unknown;
  artifactVersion?: unknown;
  artifactId?: unknown;
}

export function toQueryString(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

export function toNullableQueryString(value: unknown): string | null {
  return value == null ? null : String(value);
}

export function toQueryNumber(value: unknown, fallback = 0): number {
  const normalized = Number(value ?? fallback);
  return Number.isFinite(normalized) ? normalized : fallback;
}

export function toNullableQueryNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

export function toQueryArtifactSummary(row: QueryArtifactRawRow): QueryArtifactSummary | null {
  const version = toNullableQueryNumber(row.artifactVersion);
  if (version == null) {
    return null;
  }

  return {
    kind: toQueryString(row.artifactKind),
    key: toQueryString(row.artifactKey),
    version,
    id: toQueryString(row.artifactId),
  };
}

export function normalizeEngineDeploymentEnvironmentTag(
  engineId: unknown,
  environmentTag: string | null | undefined
): string | null {
  return toQueryString(engineId) === '__env__' ? null : (environmentTag ?? null);
}

export function toEngineDeploymentMeta(
  deployment: Pick<EngineDeployment, 'engineId' | 'deployedAt' | 'engineName' | 'environmentTag'> | null | undefined
): {
  deployedAt: number | null;
  engineName: string | null;
  environmentTag: string | null;
} {
  return {
    deployedAt: deployment ? toNullableQueryNumber(deployment.deployedAt) : null,
    engineName: deployment?.engineName ?? null,
    environmentTag: deployment
      ? normalizeEngineDeploymentEnvironmentTag(deployment.engineId, deployment.environmentTag)
      : null,
  };
}
