#!/busybox/sh
set -eu

API_UPSTREAM_DEFAULT="backend:8787"
API_UPSTREAM="${API_UPSTREAM:-$API_UPSTREAM_DEFAULT}"

TEMPLATE_PATH="/nginx-site.conf.template"
OUTPUT_PATH="/tmp/nginx-site.conf"

if [ -f "$TEMPLATE_PATH" ]; then
  /busybox/sed "s|\${API_UPSTREAM}|${API_UPSTREAM}|g" "$TEMPLATE_PATH" > "$OUTPUT_PATH"
fi

exec "$@"
