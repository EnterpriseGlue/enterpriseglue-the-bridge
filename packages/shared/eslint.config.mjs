import js from '@eslint/js';
import ts from 'typescript-eslint';

/**
 * Clean Architecture ESLint Configuration
 * 
 * Enforces import boundaries between architectural layers:
 * - domain: Can only import from itself
 * - application: Can import domain
 * - infrastructure: Can import domain, application
 * - interfaces: Can import all layers
 */

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Import boundary rules for Clean Architecture
      'no-restricted-imports': ['error', {
        zones: [
          // Domain layer: pure, no external dependencies
          {
            target: './src/domain/**/*',
            from: ['./src/application/**/*', './src/infrastructure/**/*', './src/interfaces/**/*'],
            message: 'Domain layer cannot import from other layers (Clean Architecture)',
          },
          // Application layer: can use domain only
          {
            target: './src/application/**/*',
            from: ['./src/infrastructure/**/*', './src/interfaces/**/*'],
            message: 'Application layer cannot import from infrastructure or interfaces (Clean Architecture)',
          },
          // Infrastructure layer: can use domain and application
          {
            target: './src/infrastructure/**/*',
            from: ['./src/interfaces/**/*'],
            message: 'Infrastructure layer cannot import from interfaces (Clean Architecture)',
          },
          // Interfaces layer: can use all layers (no restrictions)
        ],
      }],
    },
  },
  {
    // Ignore legacy re-export files during transition
    ignores: [
      'src/db/**/*',
      'src/services/**/*',
      'src/middleware/**/*',
      'dist/**/*',
    ],
  },
);
