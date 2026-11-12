#!/usr/bin/env bash
set -Eeuo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

# Rama a desplegar: la que pasa el workflow, o la que ya tiene este clon
# (master en produccion, develop en dev).
BRANCH="${DEPLOY_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

echo "Cambiando a la rama $BRANCH..."
git checkout "$BRANCH"

echo "Obteniendo los ultimos cambios..."
git pull --ff-only origin "$BRANCH"

WEB_PORT="$(python3 - <<'PY'
import socket

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.bind(("0.0.0.0", 0))
    print(sock.getsockname()[1])
PY
)"

ENV_FILE=".env"
TEMP_ENV_FILE="$(mktemp)"
trap 'rm -f "$TEMP_ENV_FILE"' EXIT

if [ -f "$ENV_FILE" ]; then
	awk -v port="$WEB_PORT" '
		BEGIN { updated = 0 }
		/^WEB_PORT=/ {
			print "WEB_PORT=" port
			updated = 1
			next
		}
		{ print }
		END {
			if (!updated) print "WEB_PORT=" port
		}
	' "$ENV_FILE" > "$TEMP_ENV_FILE"
else
	printf 'WEB_PORT=%s\n' "$WEB_PORT" > "$TEMP_ENV_FILE"
fi

mv "$TEMP_ENV_FILE" "$ENV_FILE"
trap - EXIT

echo "Usando el puerto $WEB_PORT"
docker compose up -d --build --remove-orphans