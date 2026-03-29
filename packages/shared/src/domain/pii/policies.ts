/**
 * PII Domain Policies
 * 
 * Pure functions for PII detection and redaction logic.
 */

import type { 
  PiiType, 
  PiiDetection, 
  PiiDetectionResult, 
  RedactionOptions, 
  RedactionResult,
  PiiPolicy 
} from './models.js';

/**
 * Default redaction options
 */
export const DEFAULT_REDACTION_OPTIONS: RedactionOptions = {
  maskChar: '*',
  visiblePrefix: 2,
  visibleSuffix: 2,
  redactionMessage: '[REDACTED]',
};

/**
 * Validate an email address format
 */
export function isValidEmail(value: string): boolean {
  // RFC 5322 simplified pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value);
}

/**
 * Validate credit card number using Luhn algorithm
 */
export function isValidCreditCard(value: string): boolean {
  // Remove spaces and dashes
  const clean = value.replace(/[\s-]/g, '');
  
  // Must be 13-19 digits
  if (!/^\d{13,19}$/.test(clean)) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate IBAN format (basic)
 */
export function isValidIban(value: string): boolean {
  // Remove spaces
  const clean = value.replace(/\s/g, '').toUpperCase();
  
  // Must start with 2 letters (country code) and be 15-34 chars total
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) {
    return false;
  }
  
  // Basic length check by common countries
  const countryCode = clean.substring(0, 2);
  const lengths: Record<string, number> = {
    'DE': 22, 'GB': 22, 'FR': 27, 'ES': 24, 'IT': 27,
    'NL': 18, 'BE': 16, 'AT': 20, 'CH': 21, 'US': 0, // US doesn't use IBAN
  };
  
  const expectedLength = lengths[countryCode];
  if (expectedLength && clean.length !== expectedLength) {
    return false;
  }
  
  return true;
}

/**
 * Calculate risk score based on detection types
 */
export function calculateRiskScore(detections: PiiDetection[]): number {
  if (detections.length === 0) {
    return 0;
  }
  
  // Weight different PII types by severity
  const weights: Record<PiiType, number> = {
    'ssn': 1.0,
    'credit-card': 0.9,
    'api-key': 0.9,
    'password': 0.8,
    'iban': 0.7,
    'email': 0.5,
    'phone': 0.5,
    'ip-address': 0.3,
    'url': 0.2,
    'custom': 0.5,
  };
  
  let totalWeight = 0;
  let weightedConfidence = 0;
  
  for (const detection of detections) {
    const weight = weights[detection.type] || 0.5;
    weightedConfidence += detection.confidence * weight;
    totalWeight += weight;
  }
  
  // Normalize to 0-1
  return Math.min(1, weightedConfidence / Math.max(1, totalWeight * 0.7));
}

/**
 * Check if a value matches the allowlist
 */
export function isAllowlisted(value: string, allowlist: string[]): boolean {
  for (const pattern of allowlist) {
    // Exact match
    if (pattern === value) {
      return true;
    }
    
    // Regex pattern
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      const regex = new RegExp(pattern.slice(1, -1));
      if (regex.test(value)) {
        return true;
      }
    }
    
    // Wildcard at start or end
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(value)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Filter detections based on policy
 */
export function filterDetections(
  detections: PiiDetection[],
  policy: Pick<PiiPolicy, 'enabledTypes' | 'minConfidence' | 'allowlist'>
): PiiDetection[] {
  return detections.filter(detection => {
    // Check type is enabled
    if (!policy.enabledTypes.includes(detection.type)) {
      return false;
    }
    
    // Check confidence threshold
    if (detection.confidence < policy.minConfidence) {
      return false;
    }
    
    // Check allowlist
    if (isAllowlisted(detection.value, policy.allowlist)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Redact a detected PII value
 */
export function redactValue(
  value: string,
  options: RedactionOptions = DEFAULT_REDACTION_OPTIONS
): string {
  const { maskChar, visiblePrefix, visibleSuffix, redactionMessage } = options;
  
  // If value is shorter than visible parts, just return message
  if (value.length <= visiblePrefix + visibleSuffix) {
    return redactionMessage || maskChar.repeat(value.length);
  }
  
  const prefix = value.slice(0, visiblePrefix);
  const suffix = value.slice(-visibleSuffix);
  const middleLength = value.length - visiblePrefix - visibleSuffix;
  
  return prefix + maskChar.repeat(middleLength) + suffix;
}

/**
 * Redact all PII from content
 */
export function redactContent(
  content: string,
  detections: PiiDetection[],
  options: RedactionOptions = DEFAULT_REDACTION_OPTIONS
): RedactionResult {
  // Sort by position (descending) to avoid index shifts
  const sortedDetections = [...detections].sort((a, b) => b.startIndex - a.startIndex);
  
  let redacted = content;
  const appliedDetections: PiiDetection[] = [];
  
  for (const detection of sortedDetections) {
    const before = redacted.slice(0, detection.startIndex);
    const after = redacted.slice(detection.endIndex);
    const redactedValue = redactValue(detection.value, options);
    
    redacted = before + redactedValue + after;
    appliedDetections.push(detection);
  }
  
  return {
    original: content,
    redacted,
    detections: appliedDetections,
    redactionCount: appliedDetections.length,
  };
}

/**
 * Merge overlapping detections (keep the higher confidence one)
 */
export function mergeOverlappingDetections(detections: PiiDetection[]): PiiDetection[] {
  if (detections.length <= 1) {
    return detections;
  }
  
  // Sort by start index
  const sorted = [...detections].sort((a, b) => a.startIndex - b.startIndex);
  const merged: PiiDetection[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    // Check for overlap
    if (current.startIndex < last.endIndex) {
      // Overlapping - keep the one with higher confidence
      if (current.confidence > last.confidence) {
        merged[merged.length - 1] = current;
      }
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}

/**
 * Create a default PII policy
 */
export function createDefaultPolicy(): PiiPolicy {
  return {
    enabledTypes: ['email', 'phone', 'credit-card', 'ssn', 'api-key', 'password'],
    minConfidence: 0.7,
    redactionOptions: DEFAULT_REDACTION_OPTIONS,
    allowlist: [],
  };
}

/**
 * Validate a PII policy configuration
 */
export function validatePolicy(policy: PiiPolicy): boolean {
  // Must have at least one enabled type
  if (!Array.isArray(policy.enabledTypes) || policy.enabledTypes.length === 0) {
    return false;
  }
  
  // Confidence must be in valid range
  if (policy.minConfidence < 0 || policy.minConfidence > 1) {
    return false;
  }
  
  // Redaction options must be valid
  if (!policy.redactionOptions || typeof policy.redactionOptions.maskChar !== 'string') {
    return false;
  }
  
  return true;
}
