# Changelog

All notable changes to Astromich will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-07-06

### Added
- **Docker containerization support** with multi-stage builds for production deployment
- **UnRAID container templates** for easy deployment on home servers
- **PostgreSQL database support** for production environments while maintaining SQLite for development
- **Worker process management** with enable/disable functionality and crash recovery
- **Health check endpoints** for container monitoring
- **Comprehensive security model** with proper secret management
- **Environment configuration examples** with `.env.example` for secure setup

### Changed
- **Project renamed** from "AstroRep" to "Astromich" across all files and configurations
- **Monorepo structure** - reorganized codebase into `/apps/` and `/packages/` directories
- **Database configuration** now supports both SQLite (development) and PostgreSQL (production)
- **Configuration service** enhanced to prioritize database settings over environment variables
- **Tailwind CSS paths** updated for new monorepo structure

### Fixed
- **Critical security vulnerability**: Removed hardcoded API keys and secrets from repository
- **Client-side API key exposure**: Eliminated VITE_* environment variables that exposed secrets to browser
- **Thumbnail proxy endpoint**: Fixed 500 Internal Server Error by using configuration service instead of undefined environment variables
- **Vite configuration**: Updated client template path resolution for monorepo structure
- **Development server**: Restored SQLite support for local development after containerization changes

### Security
- **🔒 CRITICAL**: All hardcoded secrets removed from `.env` and replaced with placeholders
- **🔒 Enhanced .gitignore**: Added comprehensive patterns to prevent secret files from being committed
- **🔒 Non-root container execution**: Docker containers now run as dedicated `astromich` user
- **🔒 API key logging**: Removed console.log statements that could leak secrets to logs
- **🔒 Client-side protection**: Eliminated client-side environment variables containing API keys

### Infrastructure
- **Multi-stage Docker builds** with optimized Alpine Linux images
- **Docker Compose configuration** with PostgreSQL service and health checks
- **Container networking** with isolated internal communication
- **Volume management** for persistent data and configuration
- **Graceful shutdown handling** with proper SIGTERM/SIGINT signal management
- **Startup scripts** with database connection waiting and automatic migrations

### Developer Experience
- **Improved error handling** with better debugging information
- **Configuration documentation** with security best practices
- **Development tooling** maintained compatibility while adding production capabilities
- **Test script security** - redacted sensitive information in console outputs

### Breaking Changes
- **Environment variables**: Direct `IMMICH_URL` and `IMMICH_API_KEY` environment variables are no longer used by default - configuration should be set via admin interface or explicitly via config service
- **File structure**: Old `/client/` and `/server/` directories moved to `/apps/client/` and `/apps/server/`

### Migration Notes
- **For existing users**: Copy your current `.env` values to `.env.local` using the new `.env.example` template
- **API keys**: If you were using the exposed API keys, please rotate them immediately as they may have been compromised
- **Database**: Development continues to use SQLite, but production deployments should use PostgreSQL

### Deployment
- **UnRAID users**: Use the provided container templates in `/docs/containerization-plan.md`
- **Docker users**: Run `docker compose up` after setting environment variables
- **Development**: Run `npm run dev` as before - SQLite database will be created automatically

## [1.0.0] - 2025-01-XX

### Added
- Initial release of AstroRep (now Astromich)
- Image management and gallery functionality
- Immich integration for photo synchronization
- Astrometry.net plate solving capabilities
- Equipment catalog management
- Real-time updates via Socket.io
- Admin configuration interface
- Cron job scheduling for automated tasks