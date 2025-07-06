#!/bin/sh

# Astromich Container Startup Script
set -e

echo "Starting Astromich container..."
echo "Node.js version: $(node --version)"
echo "Environment: ${NODE_ENV:-development}"
echo "Database URL: ${DATABASE_URL:-using_default}"
echo "Plate solving enabled: ${ENABLE_PLATE_SOLVING:-true}"

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

# Run database migrations
echo "Running database migrations..."
if [ -f "/app/tools/scripts/apply-migrations.ts" ]; then
    node --loader tsx /app/tools/scripts/apply-migrations.ts || {
        echo "Migration failed, but continuing..."
    }
fi

# Create necessary directories
mkdir -p /app/config /app/logs

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

# Start main application
echo "Starting main application..."
node /app/dist/index.js &
MAIN_PID=$!
echo "Main process started with PID: $MAIN_PID"

# Start worker process if enabled
if [ "${ENABLE_PLATE_SOLVING:-true}" = "true" ]; then
    echo "Starting worker process..."
    node /app/dist/worker.js &
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
            node /app/dist/worker.js &
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