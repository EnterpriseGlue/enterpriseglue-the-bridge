/**
 * Encryption Service
 * Handles encryption/decryption of sensitive data like tokens
 */

import crypto from 'crypto';
import { config } from '@shared/config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function parseScryptSaltFromEnv(varName: string): Buffer {
  const raw = process.env[varName];
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error(`${varName} is required to decrypt legacy encrypted values`);
  }
  const v = raw.trim();
  if (/^[0-9a-fA-F]{64,}$/.test(v) && v.length % 2 === 0) {
    return Buffer.from(v, 'hex');
  }
  return Buffer.from(v, 'utf8');
}

function getEncryptionSecret(): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length !== 64) {
    return encryptionKey;
  }

  const jwtSecret = process.env.JWT_SECRET || config.jwtSecret;
  return jwtSecret;
}

function getRawKeyIfHex(): Buffer | null {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length === 64 && /^[0-9a-fA-F]+$/.test(encryptionKey)) {
    return Buffer.from(encryptionKey, 'hex');
  }
  return null;
}

function deriveKeyV2(salt: Buffer): Buffer {
  const rawKey = getRawKeyIfHex();
  if (rawKey) return rawKey;
  return crypto.scryptSync(getEncryptionSecret(), salt, 32);
}

function deriveKeyLegacy(): Buffer {
  const rawKey = getRawKeyIfHex();
  if (rawKey) return rawKey;

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length !== 64) {
    const salt = parseScryptSaltFromEnv('ENCRYPTION_LEGACY_KEY_SALT');
    return crypto.scryptSync(encryptionKey, salt, 32);
  }

  const legacySecret = process.env.ENCRYPTION_LEGACY_SECRET;
  const salt = parseScryptSaltFromEnv('ENCRYPTION_LEGACY_JWT_SALT');
  return crypto.scryptSync((legacySecret && legacySecret.trim().length > 0) ? legacySecret.trim() : getEncryptionSecret(), salt, 32);
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(32);
  const key = deriveKeyV2(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format v2: v2:salt:iv:authTag:ciphertext
  return `v2:${salt.toString('base64')}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string value
 * Expects base64 encoded string: iv:authTag:ciphertext
 */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');

  // v2 format
  if (parts.length === 5 && parts[0] === 'v2') {
    const salt = Buffer.from(parts[1], 'base64');
    const iv = Buffer.from(parts[2], 'base64');
    const authTag = Buffer.from(parts[3], 'base64');
    const ciphertext = parts[4];

    const key = deriveKeyV2(salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // legacy format: iv:authTag:ciphertext
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const key = deriveKeyLegacy();
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const ciphertext = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Check if a string is encrypted (has our format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3 && !(parts.length === 5 && parts[0] === 'v2')) return false;
  
  try {
    // Check if parts are valid base64 (best effort)
    if (parts.length === 5 && parts[0] === 'v2') {
      Buffer.from(parts[1], 'base64');
      Buffer.from(parts[2], 'base64');
      Buffer.from(parts[3], 'base64');
      return true;
    }
    Buffer.from(parts[0], 'base64');
    Buffer.from(parts[1], 'base64');
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely decrypt - returns original value if not encrypted or decryption fails
 */
export function safeDecrypt(value: string): string {
  if (!isEncrypted(value)) {
    return value;
  }
  
  try {
    return decrypt(value);
  } catch {
    return value;
  }
}

/**
 * Hash a value (one-way, for comparison)
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
