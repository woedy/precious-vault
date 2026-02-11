#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "[$(date)] Starting entrypoint script..."

# Wait for database
if [ -n "$DB_HOST" ]; then
    echo "[$(date)] Waiting for database at $DB_HOST:$DB_PORT..."
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
      echo "[$(date)] Database is unavailable - sleeping"
      sleep 2
    done
    echo "[$(date)] Database is up and running!"
fi

if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo "[$(date)] Running migrations..."
    python manage.py migrate --noinput

    echo "[$(date)] Collecting static files..."
    python manage.py collectstatic --noinput
else
    echo "[$(date)] Skipping migrations and static file collection (SKIP_MIGRATIONS=true)"
fi

echo "[$(date)] Starting application with command: $@"
exec "$@"
