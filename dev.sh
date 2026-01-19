#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env.docker"

 COMPOSE_ARGS=()
 if [[ "${EG_COMPOSE_CI:-}" == "1" ]]; then
   COMPOSE_ARGS+=( -f docker-compose.yml -f docker-compose.ci.yml )
 fi

cd "$SCRIPT_DIR"

if [[ -f "$ENV_FILE" ]]; then
  exec docker compose --env-file .env.docker "${COMPOSE_ARGS[@]}" up --build "$@"
fi

exec docker compose "${COMPOSE_ARGS[@]}" up --build "$@"
