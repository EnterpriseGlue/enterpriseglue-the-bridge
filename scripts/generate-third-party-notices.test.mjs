import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';

import {
  expandWorkspaceDirs,
  getInternalWorkspaceRefs,
  inferLicenseFromPackageDir,
} from './generate-third-party-notices.mjs';

test('expandWorkspaceDirs discovers direct and globbed workspaces', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'eg-licenses-'));

  try {
    await mkdir(path.join(repoRoot, 'backend'), { recursive: true });
    await mkdir(path.join(repoRoot, 'frontend'), { recursive: true });
    await mkdir(path.join(repoRoot, 'packages', 'shared'), { recursive: true });
    await mkdir(path.join(repoRoot, 'packages', 'frontend-host'), { recursive: true });
    await mkdir(path.join(repoRoot, 'packages', 'notes'), { recursive: true });

    await writeFile(path.join(repoRoot, 'backend', 'package.json'), '{"name":"backend"}\n', 'utf8');
    await writeFile(path.join(repoRoot, 'frontend', 'package.json'), '{"name":"frontend"}\n', 'utf8');
    await writeFile(path.join(repoRoot, 'packages', 'shared', 'package.json'), '{"name":"@enterpriseglue/shared"}\n', 'utf8');
    await writeFile(path.join(repoRoot, 'packages', 'frontend-host', 'package.json'), '{"name":"@enterpriseglue/frontend-host"}\n', 'utf8');

    const workspaceDirs = await expandWorkspaceDirs(repoRoot, ['backend', 'frontend', 'packages/*']);

    assert.deepEqual(
      workspaceDirs.map((dir) => path.relative(repoRoot, dir)),
      ['backend', 'frontend', 'packages/frontend-host', 'packages/shared'],
    );
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('getInternalWorkspaceRefs includes internal packages from all dependency sections', () => {
  const refs = getInternalWorkspaceRefs(
    {
      dependencies: {
        '@enterpriseglue/shared': '*',
      },
      devDependencies: {
        '@enterpriseglue/frontend-host': '*',
      },
      peerDependencies: {
        '@enterpriseglue/backend-host': '*',
      },
      optionalDependencies: {
        '@enterpriseglue/enterprise-plugin-api': '*',
      },
    },
    new Set([
      '@enterpriseglue/shared',
      '@enterpriseglue/frontend-host',
      '@enterpriseglue/backend-host',
      '@enterpriseglue/enterprise-plugin-api',
    ]),
  );

  assert.deepEqual(refs, [
    '@enterpriseglue/backend-host',
    '@enterpriseglue/enterprise-plugin-api',
    '@enterpriseglue/frontend-host',
    '@enterpriseglue/shared',
  ]);
});

test('inferLicenseFromPackageDir falls back to component.json and LICENSE text', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'eg-license-infer-'));

  try {
    const componentDir = path.join(repoRoot, 'component-props');
    const licenseFileDir = path.join(repoRoot, 'cli-table');

    await mkdir(componentDir, { recursive: true });
    await mkdir(licenseFileDir, { recursive: true });

    await writeFile(path.join(componentDir, 'package.json'), '{"name":"component-props"}\n', 'utf8');
    await writeFile(path.join(componentDir, 'component.json'), '{"license":"MIT"}\n', 'utf8');

    await writeFile(path.join(licenseFileDir, 'package.json'), '{"name":"cli-table"}\n', 'utf8');
    await writeFile(path.join(licenseFileDir, 'LICENSE'), 'MIT License\n\nPermission is hereby granted...\n', 'utf8');

    assert.equal(await inferLicenseFromPackageDir(componentDir), 'MIT');
    assert.equal(await inferLicenseFromPackageDir(licenseFileDir), 'MIT');
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
