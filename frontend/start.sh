#!/bin/sh
set -e

CONFIG_PATH="/usr/share/nginx/html/config.js"

if [ -f "$CONFIG_PATH" ]; then
  echo "[startup] Loaded config.js"
  cat "$CONFIG_PATH"
  API_BASE_URL=$(sed -n 's/.*API_BASE_URL:[[:space:]]*"\([^"]*\)".*/\1/p' "$CONFIG_PATH")
  if [ -n "$API_BASE_URL" ]; then
    echo "[startup] API_BASE_URL=$API_BASE_URL"
  else
    echo "[startup] API_BASE_URL not found in config.js"
  fi
else
  echo "[startup] config.js not found at $CONFIG_PATH"
fi

exec nginx -g "daemon off;"
