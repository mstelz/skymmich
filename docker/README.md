# Astromich Docker Deployment

This directory contains all the necessary files for deploying Astromich using Docker containers.

## Quick Start

### 1. Clone and Build

```bash
git clone <your-repo-url>
cd astromich
cp .env.example .env
# Edit .env with your configuration
docker compose up -d
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Required: PostgreSQL password
POSTGRES_PASSWORD=your_secure_password_here

# Optional: Application configuration
ASTROMICH_PORT=5000
IMMICH_URL=http://your-immich-server:2283
IMMICH_API_KEY=your_immich_api_key_here
ASTROMETRY_API_KEY=your_astrometry_api_key_here
ENABLE_PLATE_SOLVING=true
PLATE_SOLVE_MAX_CONCURRENT=3
```

## Files Overview

### Core Files
- `Dockerfile` - Multi-stage build for Astromich application
- `docker-compose.yml` - Complete development/production setup
- `startup.sh` - Container entry point script
- `.env.example` - Environment variable template

### UnRAID Templates
- `unraid-templates/astromich.xml` - Main application template
- `unraid-templates/astromich-db.xml` - PostgreSQL database template

## UnRAID Installation

### Step 1: Install Database
1. Go to Docker tab in UnRAID
2. Click "Add Container"
3. Use template URL: `https://raw.githubusercontent.com/your-repo/astromich/main/docker/unraid-templates/astromich-db.xml`
4. Set a strong database password
5. Apply and start container

### Step 2: Install Astromich
1. Click "Add Container" again
2. Use template URL: `https://raw.githubusercontent.com/your-repo/astromich/main/docker/unraid-templates/astromich.xml`
3. Configure database URL with the password from Step 1
4. Add your Immich and Astrometry.net credentials (optional)
5. Apply and start container

### Step 3: Access Application
- Open web interface: `http://your-unraid-ip:5000`
- Configure admin settings
- Start syncing your astrophotography collection!

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

# Scale worker (if needed)
docker compose up -d --scale astrorep=1
```

## Container Architecture

```
┌─────────────────────────────────────┐    ┌─────────────────────┐
│        Astromich Container          │    │   PostgreSQL        │
├─────────────────────────────────────┤    │   Container         │
│  Frontend (React SPA)              │    ├─────────────────────┤
│  Backend (Express.js API)          │◄──►│  Database Engine    │
│  Worker (Plate Solving)            │    │  Data Storage       │
│  Real-time Updates (Socket.io)     │    │  Health Checks      │
└─────────────────────────────────────┘    └─────────────────────┘
```

## Health Monitoring

Both containers include health checks:

### Astromich Health Check
- Endpoint: `http://localhost:5000/api/health`
- Checks database connectivity and worker status
- 30-second intervals with 40-second startup period

### PostgreSQL Health Check
- Command: `pg_isready -U astrorep -d astrorep`
- 10-second intervals with 30-second startup period

## Data Persistence

### Volumes
- **Astromich Config**: `/mnt/user/appdata/astromich/config`
- **PostgreSQL Data**: `/mnt/user/appdata/astromich/database`

### Backup Strategy
```bash
# Backup database
docker exec astromich-db pg_dump -U astromich astromich > backup.sql

# Backup configuration
tar -czf astromich-config-backup.tar.gz /mnt/user/appdata/astromich/config

# Restore database
docker exec -i astromich-db psql -U astromich astromich < backup.sql
```

## Troubleshooting

### Container Won't Start
1. Check logs: `docker compose logs astromich`
2. Verify database connectivity
3. Check environment variables
4. Ensure ports aren't in use

### Worker Not Running
1. Check environment variable: `ENABLE_PLATE_SOLVING=true`
2. View worker status in health endpoint
3. Check Astrometry.net API key configuration

### Database Connection Issues
1. Verify PostgreSQL container is running
2. Check DATABASE_URL format
3. Ensure network connectivity between containers
4. Verify database credentials

### Performance Issues
1. Monitor container resources
2. Adjust `PLATE_SOLVE_MAX_CONCURRENT` setting
3. Check available disk space
4. Review PostgreSQL configuration

## Security Considerations

- Change default PostgreSQL password
- Use strong API keys
- Keep containers updated
- Monitor log files for security issues
- Consider using secrets management for production

## Development

For development with hot reload:

```bash
# Start only database
docker compose up -d astromich-db

# Run application locally
npm run dev:all
```

This allows development with live database while maintaining local development workflow.