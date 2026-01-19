// @ts-nocheck
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const defaultSeedFile = path.resolve(process.cwd(), 'test/e2e/.seed/user.json');

export function getE2ECredentials() {
  const env = process.env;
  let email = env.E2E_USER;
  let password = env.E2E_PASSWORD;

  const seedFile = env.E2E_SEED_FILE || defaultSeedFile;
  if ((!email || !password) && existsSync(seedFile)) {
    try {
      const data = JSON.parse(readFileSync(seedFile, 'utf8')) as { email?: string; password?: string };
      email = email || data.email;
      password = password || data.password;
    } catch {
      // ignore parsing errors; env vars still take precedence
    }
  }

  return { email, password };
}

export function hasE2ECredentials() {
  const { email, password } = getE2ECredentials();
  return Boolean(email && password);
}
