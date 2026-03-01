#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

if [[ ! -d frontend/src || ! -d backend/src ]]; then
  echo "[oss-ee-boundary] frontend/src or backend/src not found; skipping"
  exit 0
fi

fail=0

scan_forbidden_pattern() {
  local pattern="$1"
  local description="$2"

  local matches
  matches=$(grep -RIn \
    --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.cjs' \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
    "$pattern" frontend/src backend/src || true)

  if [[ -n "$matches" ]]; then
    echo "❌ [oss-ee-boundary] Forbidden pattern detected: $description"
    echo "$matches"
    echo
    fail=1
  fi
}

scan_pattern_with_allowlist() {
  local pattern="$1"
  local allowed_file="$2"
  local description="$3"

  local matches
  matches=$(grep -RIn \
    --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.cjs' \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
    "$pattern" frontend/src backend/src || true)

  if [[ -z "$matches" ]]; then
    return
  fi

  local violations
  violations=$(printf '%s\n' "$matches" | grep -v "^${allowed_file}:" || true)

  if [[ -n "$violations" ]]; then
    echo "❌ [oss-ee-boundary] Forbidden coupling detected: $description"
    echo "Allowed only in: ${allowed_file}"
    echo "$violations"
    echo
    fail=1
  fi
}

scan_pattern_with_allowlist "@enterpriseglue/enterprise-frontend" "frontend/src/enterprise/loadEnterpriseFrontendPlugin.ts" "frontend plugin package import outside host loader"
scan_pattern_with_allowlist "@enterpriseglue/enterprise-backend" "backend/src/enterprise/loadEnterpriseBackendPlugin.ts" "backend plugin package import outside host loader"

scan_forbidden_pattern "enterpriseglue-the-bridge-ee" "OSS source referencing EE repository internals"
scan_forbidden_pattern "@enterpriseglue/enterprise-frontend/src" "OSS importing EE frontend package internals"
scan_forbidden_pattern "@enterpriseglue/enterprise-backend/src" "OSS importing EE backend package internals"

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "✅ [oss-ee-boundary] OSS boundary guard passed."
