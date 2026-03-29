/**
 * Infrastructure - PII Providers
 * 
 * PII detection provider implementations.
 * Re-exported from legacy services/pii/providers during migration.
 * 
 * @deprecated Use @shared/infrastructure/providers/pii directly
 */

export { RegexProvider as RegexPiiProvider } from '../../../services/pii/providers/regex-provider.js';
export { AwsComprehendProvider } from '../../../services/pii/providers/aws-comprehend-provider.js';
export { AzurePiiProvider } from '../../../services/pii/providers/azure-pii-provider.js';
export { GcpDlpProvider } from '../../../services/pii/providers/gcp-dlp-provider.js';
export { PresidioProvider as PresidioPiiProvider } from '../../../services/pii/providers/presidio-provider.js';
