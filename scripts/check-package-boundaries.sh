#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

fail=0

SOURCE_DIRS=(
  "backend/src"
  "frontend/src"
  "packages/backend-host/src"
  "packages/frontend-host/src"
  "packages/shared/src"
)

ROUTE_DB_ALLOWLIST=(
  "packages/backend-host/src/modules/engines/routes/deployments.ts"
  "packages/backend-host/src/modules/engines/routes/management.ts"
  "packages/backend-host/src/modules/git/routes/clone.ts"
  "packages/backend-host/src/modules/git/routes/createOnline.ts"
)

print_matches() {
  local label="$1"
  local matches="$2"

  if [[ -n "$matches" ]]; then
    echo "❌ [package-boundaries] ${label}"
    echo "$matches"
    echo
    fail=1
  fi
}

scan_cross_package_src_imports() {
  local matches
  matches=$(grep -RInE \
    --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.cjs' \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
    "(^|[[:space:]])(import|export).*(from[[:space:]]+)?['\"][^'\"]*/src(/|['\"])" \
    "${SOURCE_DIRS[@]}" || true)

  print_matches "Cross-package or package-internal /src import detected. Import through package exports/barrels instead." "$matches"
}

scan_route_db_access() {
  local route_files matches violations allowed_regex
  route_files=$(find packages/backend-host/src/modules -type f -path '*/routes/*.ts' -print)

  if [[ -z "$route_files" ]]; then
    return
  fi

  matches=$(printf '%s\n' "$route_files" | xargs grep -nH "getDataSource" 2>/dev/null || true)

  if [[ -z "$matches" ]]; then
    return
  fi

  allowed_regex="^($(printf '%s|' "${ROUTE_DB_ALLOWLIST[@]}" | sed 's/|$//')):"
  violations=$(printf '%s\n' "$matches" | grep -Ev "$allowed_regex" || true)

  if [[ -n "$violations" ]]; then
    echo "❌ [package-boundaries] Route-layer database access detected outside the temporary allowlist. Move DB access behind services/query services."
    echo "$violations"
    echo
    fail=1
  fi
}

scan_cross_package_src_imports
scan_route_db_access

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "✅ [package-boundaries] Package boundary guard passed."
