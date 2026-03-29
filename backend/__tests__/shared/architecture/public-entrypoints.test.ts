import { describe, expect, it } from 'vitest';
import { dirname, join, resolve } from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const sharedRoot = resolve(currentDir, '../../../../packages/shared');
const sharedSrcRoot = join(sharedRoot, 'src');

function collectTypeScriptFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTypeScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractImports(content: string): string[] {
  const importRegex = /import\s+(?:type\s+)?(?:{[^}]*}|\*\s+as\s+\w+|\w+(?:,\s*{[^}]*})?)\s+from\s+['\"]([^'\"]+)['\"];?/g;
  const imports: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

describe('shared package public entrypoints', () => {
  it('declares the clean architecture entrypoints in package exports', () => {
    const packageJson = JSON.parse(readFileSync(join(sharedRoot, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };

    expect(packageJson.exports).toHaveProperty('.');
    expect(packageJson.exports).toHaveProperty('./domain');
    expect(packageJson.exports).toHaveProperty('./application');
    expect(packageJson.exports).toHaveProperty('./infrastructure');
    expect(packageJson.exports).toHaveProperty('./interfaces');
  });

  it('has source entrypoints for the clean architecture public API', () => {
    expect(existsSync(join(sharedSrcRoot, 'shared-index.ts'))).toBe(true);
    expect(existsSync(join(sharedSrcRoot, 'domain/index.ts'))).toBe(true);
    expect(existsSync(join(sharedSrcRoot, 'application/index.ts'))).toBe(true);
    expect(existsSync(join(sharedSrcRoot, 'infrastructure/index.ts'))).toBe(true);
    expect(existsSync(join(sharedSrcRoot, 'interfaces/index.ts'))).toBe(true);
  });
});

describe('shared package domain boundaries', () => {
  it('keeps actual domain source files free from application, infrastructure, and interfaces imports', () => {
    const domainRoot = join(sharedSrcRoot, 'domain');
    expect(existsSync(domainRoot)).toBe(true);
    expect(statSync(domainRoot).isDirectory()).toBe(true);

    const domainFiles = collectTypeScriptFiles(domainRoot);
    expect(domainFiles.length).toBeGreaterThan(0);

    for (const filePath of domainFiles) {
      const content = readFileSync(filePath, 'utf8');
      const imports = extractImports(content);
      const forbiddenImports = imports.filter((importPath) =>
        importPath.includes('/application/') ||
        importPath.includes('/infrastructure/') ||
        importPath.includes('/interfaces/') ||
        importPath === '@enterpriseglue/shared/application' ||
        importPath === '@enterpriseglue/shared/infrastructure' ||
        importPath === '@enterpriseglue/shared/interfaces'
      );

      expect(forbiddenImports).toEqual([]);
    }
  });
});

describe('shared package migration-safe layer boundaries', () => {
  it('keeps application source files free from infrastructure and interfaces imports', () => {
    const applicationRoot = join(sharedSrcRoot, 'application');
    expect(existsSync(applicationRoot)).toBe(true);
    expect(statSync(applicationRoot).isDirectory()).toBe(true);

    const applicationFiles = collectTypeScriptFiles(applicationRoot);
    expect(applicationFiles.length).toBeGreaterThan(0);

    for (const filePath of applicationFiles) {
      const content = readFileSync(filePath, 'utf8');
      const imports = extractImports(content);
      const forbiddenImports = imports.filter((importPath) =>
        importPath.includes('/infrastructure/') ||
        importPath.includes('/interfaces/') ||
        importPath === '@enterpriseglue/shared/infrastructure' ||
        importPath === '@enterpriseglue/shared/interfaces'
      );

      expect(forbiddenImports).toEqual([]);
    }
  });

  it('keeps infrastructure source files free from application and interfaces imports', () => {
    const infrastructureRoot = join(sharedSrcRoot, 'infrastructure');
    expect(existsSync(infrastructureRoot)).toBe(true);
    expect(statSync(infrastructureRoot).isDirectory()).toBe(true);

    const infrastructureFiles = collectTypeScriptFiles(infrastructureRoot);
    expect(infrastructureFiles.length).toBeGreaterThan(0);

    for (const filePath of infrastructureFiles) {
      const content = readFileSync(filePath, 'utf8');
      const imports = extractImports(content);
      const forbiddenImports = imports.filter((importPath) =>
        importPath.includes('/application/') ||
        importPath.includes('/interfaces/') ||
        importPath === '@enterpriseglue/shared/application' ||
        importPath === '@enterpriseglue/shared/interfaces'
      );

      expect(forbiddenImports).toEqual([]);
    }
  });

  it('keeps interfaces source files free from infrastructure imports', () => {
    const interfacesRoot = join(sharedSrcRoot, 'interfaces');
    expect(existsSync(interfacesRoot)).toBe(true);
    expect(statSync(interfacesRoot).isDirectory()).toBe(true);

    const interfacesFiles = collectTypeScriptFiles(interfacesRoot);
    expect(interfacesFiles.length).toBeGreaterThan(0);

    for (const filePath of interfacesFiles) {
      const content = readFileSync(filePath, 'utf8');
      const imports = extractImports(content);
      const forbiddenImports = imports.filter((importPath) =>
        importPath.includes('/infrastructure/') ||
        importPath === '@enterpriseglue/shared/infrastructure'
      );

      expect(forbiddenImports).toEqual([]);
    }
  });
});
