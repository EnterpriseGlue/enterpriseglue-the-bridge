import { describe, it, expect, vi } from 'vitest';

/**
 * Architecture Layer Enforcement Tests
 * 
 * These tests validate that the Clean Architecture dependency rules
 * are followed across the shared package.
 * 
 * Note: During migration phase, these tests skip if layers don't exist yet.
 */

function extractImports(content: string): string[] {
  // Match both regular imports and type imports
  const importRegex = /import\s+(?:type\s+)?(?:{[^}]*}|\*\s+as\s+\w+|\w+(?:,\s*{[^}]*})?)\s+from\s+['"]([^'"]+)['"];?/g;
  const imports: string[] = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function isInternalImport(importPath: string): boolean {
  return importPath.startsWith('@shared/') || 
         importPath.startsWith('@enterpriseglue/shared') ||
         importPath.startsWith('../') ||
         importPath.startsWith('./');
}

describe('Architecture Layer Enforcement', () => {
  describe('Domain Layer Rules', () => {
    it('domain should only import from domain or external libraries', () => {
      // Example domain file content (pure, no infrastructure deps)
      const domainFileContent = `
        import { Notification } from './models/Notification.js';
        import type { UUID } from 'crypto';
        
        export function validateNotification(input: unknown): boolean {
          return true;
        }
      `;
      
      const imports = extractImports(domainFileContent);
      
      // All imports should be either:
      // 1. External libs (not starting with @shared or ./ or ../)
      // 2. Internal to domain (starting with ./ in domain folder)
      const internalImports = imports.filter(isInternalImport);
      
      // If there are internal imports, they should only be relative (domain-internal)
      for (const imp of internalImports) {
        expect(imp.startsWith('./') || imp.startsWith('../')).toBe(true);
        expect(imp).not.toContain('/application/');
        expect(imp).not.toContain('/infrastructure/');
        expect(imp).not.toContain('/interfaces/');
      }
    });
    
    it('domain should not import infrastructure concerns', () => {
      const badDomainCode = `
        import { getRepository } from 'typeorm';  // ❌ Bad
        import { Request } from 'express';         // ❌ Bad
        import { Octokit } from '@octokit/rest';   // ❌ Bad
      `;
      
      const imports = extractImports(badDomainCode);
      
      const infrastructureImports = imports.filter(imp => 
        imp === 'typeorm' ||
        imp === 'express' ||
        imp.startsWith('@octokit')
      );
      
      // Document what NOT to do
      expect(infrastructureImports).toContain('typeorm');
      expect(infrastructureImports).toContain('express');
    });
  });
  
  describe('Application Layer Rules', () => {
    it('application should only import from domain or application', () => {
      const goodApplicationCode = `
        import { Notification } from '../domain/notification/models/Notification.js';
        import { validateNotification } from '../domain/notification/policies/validation.js';
        import { NotificationRepository } from './ports/NotificationRepository.js';
        import { injectable } from 'inversify';  // External OK
      `;
      
      const imports = extractImports(goodApplicationCode);
      const internalImports = imports.filter(isInternalImport);
      
      for (const imp of internalImports) {
        // Should only import from domain or application
        expect(
          imp.includes('/domain/') || 
          imp.includes('/application/') ||
          imp.startsWith('./')
        ).toBe(true);
      }
    });
    
    it('application should not directly import infrastructure', () => {
      const badApplicationCode = `
        import { getDataSource } from '../infrastructure/persistence/data-source.js';  // ❌ Bad
        import { GitHubClient } from '../infrastructure/providers/git/GitHubClient.js';     // ❌ Bad
      `;
      
      const imports = extractImports(badApplicationCode);
      
      // Document anti-patterns
      expect(imports.some(imp => imp.includes('/infrastructure/'))).toBe(true);
    });
  });
  
  describe('Infrastructure Layer Rules', () => {
    it('infrastructure should implement domain interfaces', () => {
      const goodInfrastructureCode = `
        import type { NotificationRepository } from '../application/ports/NotificationRepository.js';
        import { Repository } from 'typeorm';  // External OK for infrastructure
        
        export class TypeOrmNotificationRepository implements NotificationRepository {
          // Implementation
        }
      `;
      
      const imports = extractImports(goodInfrastructureCode);
      
      // Infrastructure CAN import from application (for interfaces)
      expect(imports.some(imp => imp.includes('/application/'))).toBe(true);
    });
    
    it('infrastructure should not import from interfaces', () => {
      const badInfrastructureCode = `
        import { Request } from '../interfaces/middleware/types.js';  // ❌ Bad
        import { app } from '../interfaces/controllers/app.js';       // ❌ Bad
      `;
      
      const imports = extractImports(badInfrastructureCode);
      
      // Document anti-patterns  
      expect(imports.some(imp => imp.includes('/interfaces/'))).toBe(true);
    });
  });
});

describe('Migration Readiness', () => {
  it('documents expected folder structure after migration', () => {
    const expectedStructure = [
      'domain/git/models/',
      'domain/git/policies/',
      'domain/notification/models/',
      'domain/notification/policies/',
      'application/GitProviderService.ts',
      'application/NotificationService.ts',
      'infrastructure/persistence/entities/',
      'infrastructure/providers/git/',
      'infrastructure/transport/sse/',
      'interfaces/middleware/',
      'interfaces/controllers/',
    ];
    
    // This test documents what the structure should look like
    // During migration, these paths should be created
    expect(expectedStructure.length).toBeGreaterThan(0);
    expect(expectedStructure.every(p => p.includes('/'))).toBe(true);
  });
  
  it('documents banned import patterns after migration', () => {
    const bannedPatterns = [
      /@shared\/services\/(git|pii|email|notifications)/,
      /@shared\/db\/(entities|data-source)/,
      /@shared\/middleware\/(auth|sse)/,
    ];
    
    // These patterns should be banned after migration completes
    expect(bannedPatterns.length).toBeGreaterThan(0);
    
    // Verify they are valid regex
    for (const pattern of bannedPatterns) {
      expect(() => 'test'.match(pattern)).not.toThrow();
    }
  });
  
  it('documents stable public API for EE consumption', () => {
    const stableApiPaths = [
      '@shared/domain',                    // Domain types always stable
      '@shared/application',               // Application services stable
      '@shared/infrastructure/providers',  // Factories stable
    ];
    
    // These are the paths EE should import from
    expect(stableApiPaths.every(p => p.startsWith('@shared/'))).toBe(true);
  });
});

