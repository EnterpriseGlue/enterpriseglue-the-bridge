import { Buffer } from 'node:buffer';
import { fetch } from 'undici';
import { getDataSource } from '@shared/db/data-source.js';
import { Engine } from '@shared/db/entities/Engine.js';

export interface EngineCfg {
  baseUrl: string;
  authType: 'none' | 'basic';
  username?: string | null;
  password?: string | null;
}

async function getActiveEngine(): Promise<EngineCfg> {
  const dataSource = await getDataSource();
  const engineRepo = dataSource.getRepository(Engine);
  const row = await engineRepo.findOneBy({ active: true });
  if (row && row.baseUrl) {
    const authType = (row as any).authType || ((row.username ? 'basic' : 'none') as 'none' | 'basic');
    return {
      baseUrl: String(row.baseUrl),
      authType,
      username: (row as any).username || null,
      password: (row as any).passwordEnc || null,
    };
  }
  // Fallback to env for dev
  const baseUrl = process.env.CAMUNDA_BASE_URL || 'http://localhost:8080/engine-rest';
  const username = process.env.CAMUNDA_USERNAME || '';
  const password = process.env.CAMUNDA_PASSWORD || '';
  const authType: 'none' | 'basic' = username ? 'basic' : 'none';
  return { baseUrl, authType, username, password };
}

function buildHeaders(cfg: EngineCfg): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.authType === 'basic' && cfg.username) {
    const token = Buffer.from(`${cfg.username}:${cfg.password ?? ''}`).toString('base64');
    h['Authorization'] = `Basic ${token}`;
  }
  return h;
}

/**
 * Base Camunda HTTP client
 */
export class CamundaClient {
  async get<T = unknown>(path: string, params?: Record<string, any>): Promise<T> {
    const cfg = await getActiveEngine();
    const url = new URL(path.startsWith('http') ? path : cfg.baseUrl.replace(/\/$/, '') + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === '') continue;
        if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, String(vv)));
        else url.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: buildHeaders(cfg),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Camunda GET ${url} failed: ${res.status} ${res.statusText} ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async post<T = unknown>(path: string, body?: any): Promise<T> {
    const cfg = await getActiveEngine();
    const url = path.startsWith('http') ? path : cfg.baseUrl.replace(/\/$/, '') + path;
    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(cfg),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Camunda POST ${url} failed: ${res.status} ${res.statusText} ${text}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  async delete(path: string): Promise<void> {
    const cfg = await getActiveEngine();
    const url = path.startsWith('http') ? path : cfg.baseUrl.replace(/\/$/, '') + path;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: buildHeaders(cfg),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Camunda DELETE ${url} failed: ${res.status} ${res.statusText} ${text}`);
    }
  }
}
