#!/usr/bin/env bash
set -Eeuo pipefail

# ci-watch.sh — Monitor a GitHub Actions workflow run in a single terminal session.
#
# Usage:
#   bash scripts/ci-watch.sh [workflow] [--trigger]
#
# Examples:
#   bash scripts/ci-watch.sh                          # watch latest docker-images run
#   bash scripts/ci-watch.sh ci                       # watch latest CI run
#   bash scripts/ci-watch.sh docker-images --trigger  # manually trigger then watch
#   bash scripts/ci-watch.sh --trigger                # trigger docker-images then watch

WORKFLOW="${1:-docker-images}"
TRIGGER=false

for arg in "$@"; do
  case "$arg" in
    --trigger) TRIGGER=true ;;
  esac
done

# Normalize short names to full workflow filenames
case "$WORKFLOW" in
  docker-images|docker) WORKFLOW="docker-images.yml" ;;
  ci)                   WORKFLOW="ci.yml" ;;
  release-please)       WORKFLOW="release-please.yml" ;;
  deploy-openshift)     WORKFLOW="deploy-openshift.yml" ;;
  --trigger)            WORKFLOW="docker-images.yml" ;;
  *)
    if [[ "$WORKFLOW" != *.yml ]]; then
      WORKFLOW="${WORKFLOW}.yml"
    fi
    ;;
esac

log() { echo "[ci-watch] $*"; }
error() { echo "[ci-watch] ERROR: $*" >&2; exit 1; }

command -v gh >/dev/null 2>&1 || error "GitHub CLI (gh) is required. Install: https://cli.github.com"

if $TRIGGER; then
  log "Triggering workflow_dispatch for $WORKFLOW ..."
  gh workflow run "$WORKFLOW"
  log "Waiting 5s for run to register ..."
  sleep 5
fi

log "Finding latest run for $WORKFLOW ..."
RUN_ID="$(gh run list --workflow="$WORKFLOW" --limit=1 --json databaseId --jq '.[0].databaseId')"
[[ -n "$RUN_ID" ]] || error "No runs found for $WORKFLOW"

log "Watching run $RUN_ID — streaming until completion ..."
echo ""

if gh run watch "$RUN_ID" --exit-status; then
  echo ""
  log "Run $RUN_ID completed successfully."
else
  EXIT_CODE=$?
  echo ""
  log "Run $RUN_ID failed (exit $EXIT_CODE). Fetching failed steps ..."
  echo ""
  gh run view "$RUN_ID" --json jobs --jq '.jobs[] | select(.conclusion=="failure") | {job: .name, failedSteps: [.steps[] | select(.conclusion=="failure") | .name]}'
  echo ""
  log "View full logs: gh run view $RUN_ID --log-failed"
  exit $EXIT_CODE
fi
