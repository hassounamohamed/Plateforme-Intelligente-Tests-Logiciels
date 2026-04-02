#!/bin/bash

# Strict mode: fail fast on errors, unset vars, and pipeline failures.
set -euo pipefail

# Allow custom migration message: ./alembic_migration.sh "add users table"
MIGRATION_MESSAGE="${1:-auto migration}"

# Resolve docker compose command for both v1 and v2 CLIs.
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo "ERROR: Docker Compose not found. Install Docker Desktop or docker-compose." >&2
    exit 1
fi

echo "Using compose command: ${COMPOSE_CMD}"

# Validate required files/directories before running container commands.
if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: docker-compose.yml not found in current directory." >&2
    exit 1
fi

if [ ! -f "alembic.ini" ]; then
    echo "ERROR: alembic.ini not found. Run this script from plateforme-back." >&2
    exit 1
fi

# Ensure Alembic directory structure exists. Do not re-init if project already configured.
if [ ! -d "migrations" ] || [ ! -f "migrations/env.py" ]; then
    echo "Initializing Alembic environment..."
    $COMPOSE_CMD run --rm api alembic init migrations
fi

if [ ! -d "migrations/versions" ]; then
    echo "Creating migrations/versions directory..."
    mkdir -p migrations/versions
fi

echo "Generating new migration: ${MIGRATION_MESSAGE}"
$COMPOSE_CMD run --rm api alembic revision --autogenerate -m "${MIGRATION_MESSAGE}"

echo "Applying migrations..."
$COMPOSE_CMD run --rm api alembic upgrade head

echo "Alembic migrations applied successfully."