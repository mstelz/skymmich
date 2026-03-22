# Skymmich Docker Deployment

This directory contains all the necessary files for deploying Skymmich using Docker containers.

## Quick Start

### 1. Clone and Build

```bash
git clone <your-repo-url>
cd skymmich
docker compose up -d
```

No external database or `.env` file required — Skymmich uses a built-in SQLite database by default.

### 2. Environment Configuration (Optional)

Copy `docker/.env.docker.example` to `.env` in the project root to customize:

```bash
# Optional: Application configuration
SKYMMICH_PORT=5000
IMMICH_URL=http://your-immich-server:2283
IMMICH_API_KEY=your_immich_api_key_here
ASTROMETRY_API_KEY=your_astrometry_api_key_here
ENABLE_PLATE_SOLVING=true
PLATE_SOLVE_MAX_CONCURRENT=3
```

**Note**: API keys can also be configured via the admin web interface after startup.

### Using PostgreSQL Instead

To use PostgreSQL instead of the built-in SQLite database, layer the postgres override:

```bash
echo "POSTGRES_PASSWORD=your_secure_password" > .env
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d
```

## Files Overview

### Core Files
- `Dockerfile` - Multi-stage build for Skymmich application
- `docker-compose.yml` - Default setup (SQLite, single container)
- `docker-compose.postgres.yml` - PostgreSQL override (layer on top)
- `startup.sh` - Container entry point script
- `.env.docker.example` - Docker environment variable template

### UnRAID Templates
- `unraid-templates/skymmich.xml` - Main application template

## UnRAID Installation

### Step 1: Install Skymmich
1. Go to Docker tab in UnRAID
2. Click "Add Container"
3. Use template URL: `https://raw.githubusercontent.com/mstelz/Skymmich/main/docker/unraid-templates/skymmich.xml`
4. Optionally add your Immich and Astrometry.net credentials
5. Apply and start container

### Step 2: Access Application
- Open web interface: `http://your-unraid-ip:2284`
- Configure admin settings
- Start syncing your astrophotography collection!

> To use PostgreSQL instead of the default SQLite database, set the `DATABASE_URL` field in the template to your PostgreSQL connection string.

## Docker Compose Commands

```bash
# Build and start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild and restart
docker compose up -d --build
```

## Container Architecture

```
┌─────────────────────────────────────┐
│        Skymmich Container           │
├─────────────────────────────────────┤
│  Frontend (React SPA)              │
│  Backend (Hono API)                │
│  Worker (Plate Solving)            │    ┌─────────────────────┐
│  Real-time Updates (WebSocket)     │    │  PostgreSQL         │
│  SQLite Database (built-in)        │◄──►│  (optional)         │
└─────────────────────────────────────┘    └─────────────────────┘
```

## Health Monitoring

### Skymmich Health Check
- Endpoint: `http://localhost:5000/api/health`
- Checks database connectivity and worker status
- 30-second intervals with 40-second startup period

### PostgreSQL Health Check (if using PostgreSQL)
- Command: `pg_isready -U skymmich -d skymmich`
- 10-second intervals with 30-second startup period

## Data Persistence

### Volumes
- **Skymmich Config + Database**: `/app/config` (includes `skymmich.db` when using SQLite)
- **Logs**: `/app/logs`
- **Sidecars**: `/app/sidecars`
- **Cache**: `/app/cache`

### Backup Strategy

**SQLite (default):**
```bash
# Backup database (just copy the file)
docker cp skymmich:/app/config/skymmich.db ./skymmich-backup.db

# Backup configuration
tar -czf skymmich-config-backup.tar.gz /mnt/user/appdata/skymmich/config

# Restore database
docker cp ./skymmich-backup.db skymmich:/app/config/skymmich.db
docker restart skymmich
```

**PostgreSQL (if using postgres override):**
```bash
# Backup database
docker exec skymmich-db pg_dump -U skymmich skymmich > backup.sql

# Restore database
docker exec -i skymmich-db psql -U skymmich skymmich < backup.sql
```

## Troubleshooting

### Container Won't Start
1. Check logs: `docker compose logs skymmich`
2. Check environment variables
3. Ensure ports aren't in use
4. Verify volume permissions (check PUID/PGID settings)

### Worker Not Running
1. Check environment variable: `ENABLE_PLATE_SOLVING=true`
2. View worker status in health endpoint
3. Check Astrometry.net API key configuration

### Database Issues
1. **SQLite**: Check that `/app/config` volume is mounted and writable
2. **PostgreSQL**: Verify the PostgreSQL container is running and `DATABASE_URL` is correct

### Performance Issues
1. Monitor container resources
2. Adjust `PLATE_SOLVE_MAX_CONCURRENT` setting
3. Check available disk space

## Security Considerations

**Critical Security Notes:**

- **Secure API key storage** - Set via environment variables or admin interface
- **No secrets in images** - Container images contain no embedded secrets
- **Regular updates** - Keep containers updated with latest security patches
- **Monitor access** - Review logs for unauthorized access attempts
- **File permissions** - Containers run as non-root user (`skymmich`)
- If using PostgreSQL: use a strong password and don't expose the PostgreSQL port externally

**Environment Variables vs Admin Interface:**
- Environment variables take precedence for initial configuration
- Admin interface settings are stored in the database
- Both methods are secure when properly configured

## Development

For development with hot reload:

```bash
# Run application locally (uses SQLite by default)
npm run dev
```
