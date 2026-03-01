#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-current}"
ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

PKG_JSON="packages/enterprise-plugin-api/package.json"
FRONTEND_DTS="packages/enterprise-plugin-api/src/frontend.d.ts"
BACKEND_DTS="packages/enterprise-plugin-api/src/backend.d.ts"
FIXTURE_TS="packages/enterprise-plugin-api/fixtures/current-plugin-fixture.ts"

fail=0

assert_file_exists() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "❌ [plugin-api-compat] Missing required file: $file"
    fail=1
  fi
}

assert_contains() {
  local file="$1"
  local pattern="$2"
  local description="$3"
  if ! grep -q "$pattern" "$file"; then
    echo "❌ [plugin-api-compat] Missing ${description} in $file"
    fail=1
  fi
}

assert_file_exists "$PKG_JSON"
assert_file_exists "$FRONTEND_DTS"
assert_file_exists "$BACKEND_DTS"

if [[ "$MODE" != "current" && "$MODE" != "next" ]]; then
  echo "❌ [plugin-api-compat] Unsupported mode: $MODE (use current|next)"
  exit 1
fi

# Baseline contract checks used by both modes.
assert_contains "$FRONTEND_DTS" "componentOverrides" "frontend componentOverrides contract"
assert_contains "$FRONTEND_DTS" "featureOverrides" "frontend featureOverrides contract"
assert_contains "$FRONTEND_DTS" "routes" "frontend routes contract"
assert_contains "$FRONTEND_DTS" "tenantRoutes" "frontend tenantRoutes contract"
assert_contains "$BACKEND_DTS" "registerRoutes" "backend registerRoutes hook"
assert_contains "$BACKEND_DTS" "migrateEnterpriseDatabase" "backend migrateEnterpriseDatabase hook"

if [[ "$MODE" == "current" ]]; then
  assert_contains "$PKG_JSON" '"private": false' "non-private plugin-api package"
  assert_contains "$PKG_JSON" '"version": "0.1.0"' "plugin-api baseline version"

  if ! npm pack --dry-run ./packages/enterprise-plugin-api >/dev/null; then
    echo "❌ [plugin-api-compat] plugin-api npm pack dry-run failed"
    fail=1
  fi
fi

if [[ "$MODE" == "next" ]]; then
  assert_file_exists "$FIXTURE_TS"
  assert_contains "$FIXTURE_TS" "frontendPluginFixture" "frontend compatibility fixture"
  assert_contains "$FIXTURE_TS" "backendPluginFixture" "backend compatibility fixture"
  assert_contains "$FIXTURE_TS" "backendContextFixture" "backend context fixture"
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "✅ [plugin-api-compat] Mode '$MODE' passed."
