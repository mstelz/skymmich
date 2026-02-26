#!/bin/sh

# Skymmich Container Startup Script
set -e

# Handle PUID and PGID for proper volume permissions
PUID=${PUID:-1001}
PGID=${PGID:-1001}

echo "Updating skymmich user to PUID=$PUID and GID=$PGID..."
groupmod -o -g "$PGID" nodejs || true
usermod -o -u "$PUID" skymmich || true

# Ensure proper ownership of application and data directories
echo "Setting directory permissions..."
chown -R skymmich:nodejs /app/config /app/logs /app/sidecars /app/dist

echo "Starting Skymmich container..."
echo "Node.js version: $(node --version)"
echo "Environment: ${NODE_ENV:-development}"
echo "Database URL: ${DATABASE_URL:-using_default}"
echo "Plate solving enabled: ${ENABLE_PLATE_SOLVING:-true}"
echo "XMP sidecar path: ${XMP_SIDECAR_PATH:-/app/sidecars}"

# Wait for database to be ready
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database connection..."
    # Extract host and port from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
    DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
    
    # Wait for PostgreSQL to be ready
    timeout=60
    while [ $timeout -gt 0 ]; do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "Database is ready!"
            break
        fi
        echo "Waiting for database... ($timeout seconds remaining)"
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        echo "ERROR: Database is not responding after 60 seconds"
        exit 1
    fi
else
    echo "No DATABASE_URL provided, using SQLite fallback"
fi

# Run database migrations as skymmich user
echo "Running database migrations..."
if [ -n "$DATABASE_URL" ]; then
    # PostgreSQL migrations
    if [ -f "/app/dist/tools/scripts/apply-pg-migrations.js" ]; then
        echo "Running PostgreSQL migrations..."
        su-exec skymmich node /app/dist/tools/scripts/apply-pg-migrations.js || {
            echo "PostgreSQL migration failed, but continuing..."
        }
    else
        echo "PostgreSQL migration script not found"
    fi
else
    # SQLite migrations for local development
    if [ -f "/app/dist/tools/scripts/apply-migrations.ts" ]; then
        echo "Running SQLite migrations..."
        su-exec skymmich node --loader tsx /app/dist/tools/scripts/apply-migrations.ts || {
            echo "SQLite migration failed, but continuing..."
        }
    else
        echo "SQLite migration script not found"
    fi
fi

# Set up signal handlers for graceful shutdown
cleanup() {
    echo "Received shutdown signal, stopping processes..."
    
    # Kill worker process if running
    if [ -n "$WORKER_PID" ] && kill -0 "$WORKER_PID" 2>/dev/null; then
        echo "Stopping worker process (PID: $WORKER_PID)..."
        kill -TERM "$WORKER_PID"
        wait "$WORKER_PID" 2>/dev/null || true
    fi
    
    # Kill main process if running
    if [ -n "$MAIN_PID" ] && kill -0 "$MAIN_PID" 2>/dev/null; then
        echo "Stopping main process (PID: $MAIN_PID)..."
        kill -TERM "$MAIN_PID"
        wait "$MAIN_PID" 2>/dev/null || true
    fi
    
    echo "Shutdown complete"
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup TERM INT

# Start main application as skymmich user
echo "Starting main application..."
su-exec skymmich node /app/dist/index.js &
MAIN_PID=$!
echo "Main process started with PID: $MAIN_PID"

# Start worker process if enabled as skymmich user
if [ "${ENABLE_PLATE_SOLVING:-true}" = "true" ]; then
    echo "Starting worker process..."
    su-exec skymmich node /app/dist/worker.js &
    WORKER_PID=$!
    echo "Worker process started with PID: $WORKER_PID"
else
    echo "Worker process disabled (ENABLE_PLATE_SOLVING=${ENABLE_PLATE_SOLVING})"
    WORKER_PID=""
fi

# Function to check if processes are running
check_processes() {
    # Check main process
    if ! kill -0 "$MAIN_PID" 2>/dev/null; then
        echo "ERROR: Main process (PID: $MAIN_PID) has died"
        return 1
    fi
    
    # Check worker process if it should be running
    if [ "${ENABLE_PLATE_SOLVING:-true}" = "true" ] && [ -n "$WORKER_PID" ]; then
        if ! kill -0 "$WORKER_PID" 2>/dev/null; then
            echo "WARNING: Worker process (PID: $WORKER_PID) has died, restarting..."
            su-exec skymmich node /app/dist/worker.js &
            WORKER_PID=$!
            echo "Worker process restarted with PID: $WORKER_PID"
        fi
    fi
    
    return 0
}

# Monitor processes
echo "Application started successfully. Monitoring processes..."
while true; do
    if ! check_processes; then
        echo "Critical process failure, shutting down container"
        cleanup
        exit 1
    fi
    sleep 30
done