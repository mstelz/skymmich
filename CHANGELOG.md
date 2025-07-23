# Changelog

All notable changes to Skymmich will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-07-23

### Fixed
- **Release Workflow**: Fixed Trivy vulnerability scanning by scanning local image before registry push
- **CI/CD**: Resolved chicken-and-egg problem with Docker image scanning in release process

## [0.1.0] - 2025-07-23

### Added
- **🎉 Initial Release**: First public release of Skymmich
- **Image Management**: Gallery interface for viewing and organizing astrophotography images
- **Immich Integration**: Synchronization with Immich photo management server
- **Plate Solving**: Astrometry.net integration for automatic celestial coordinate detection
- **Equipment Catalog**: Manage telescopes, cameras, and other astrophotography equipment
- **Admin Interface**: Web-based configuration for all application settings
- **Docker Support**: Containerized deployment with multi-architecture support

### Security
- **🔒 CRITICAL**: Updated axios from 1.10.0 to 1.11.0 to fix CVE-2025-7783 form-data vulnerability
- **🔒 SSRF Protection**: Added URL validation to admin connection testing endpoints to prevent Server-Side Request Forgery attacks
- **🔒 Protocol Validation**: Restricted connection testing to HTTP/HTTPS protocols only

### Technical
- **Database Support**: SQLite for development, PostgreSQL for production
- **Real-time Updates**: Socket.io integration for live status updates
- **Cron Scheduling**: Automated synchronization and processing tasks
- **API Documentation**: Comprehensive REST API for all functionality

## [Unreleased] - Development History

### Added
- **🎉 Open Source Release**: Skymmich is now available as an open source project under MIT license
- **Enhanced plate solving configuration**: Added configurable worker check intervals, polling intervals, max concurrent jobs, and auto-resubmit options
- **Improved admin interface**: Added detailed controls for plate solving worker configuration
- **MIT License**: Added proper open source license file

### Changed
- **Enhanced configuration system**: Plate solving settings now support fine-grained control through admin interface
- **Worker process improvements**: Added configurable intervals and concurrent job limits
- **Documentation updates**: Updated README and contributing guidelines for open source community

### Fixed
- **Configuration persistence**: Plate solving settings now properly persist and take effect without container restart
- **Worker configuration reloading**: Worker process now dynamically reloads configuration changes

### Documentation
- **Contributing guidelines**: Comprehensive guide for community contributions
- **Open source preparation**: Updated all documentation for public release
- **Configuration examples**: Enhanced environment variable documentation

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
- **Project renamed** from "AstroRep" to "Skymmich" across all files and configurations
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
- **🔒 Non-root container execution**: Docker containers now run as dedicated `skymmich` user
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
- Initial release of AstroRep (now Skymmich)
- Image management and gallery functionality
- Immich integration for photo synchronization
- Astrometry.net plate solving capabilities
- Equipment catalog management
- Real-time updates via Socket.io
- Admin configuration interface
- Cron job scheduling for automated tasks