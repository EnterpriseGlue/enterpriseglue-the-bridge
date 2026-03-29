/**
 * PII Domain Models
 * 
 * Pure domain types for Personally Identifiable Information detection and redaction.
 */

export type PiiType = 
  | 'email'
  | 'phone'
  | 'credit-card'
  | 'ssn'
  | 'ip-address'
  | 'api-key'
  | 'password'
  | 'iban'
  | 'url'
  | 'custom';

export interface PiiDetection {
  type: PiiType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number; // 0-1
}

export interface PiiDetectionResult {
  detections: PiiDetection[];
  hasPii: boolean;
  riskScore: number; // 0-1 aggregate score
}

export interface RedactionOptions {
  maskChar: string;
  visiblePrefix: number;
  visibleSuffix: number;
  redactionMessage?: string;
}

export interface RedactionResult {
  original: string;
  redacted: string;
  detections: PiiDetection[];
  redactionCount: number;
}

export interface PiiPolicy {
  enabledTypes: PiiType[];
  minConfidence: number;
  redactionOptions: RedactionOptions;
  allowlist: string[]; // Patterns to ignore
}

export interface PiiScanRequest {
  content: string;
  policy: PiiPolicy;
}

export interface PiiScanBatchResult {
  results: Map<string, PiiDetectionResult>; // key -> content identifier
  totalDetections: number;
  highRiskItems: string[]; // keys with high risk
}
