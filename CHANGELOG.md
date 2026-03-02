# Changelog

All notable changes to Skymmich will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2] - 2026-03-02

### Changed
- **Dependencies**: Updated production and development dependencies (axios, react-day-picker, react-resizable-panels, autoprefixer, @types/node) to address Dependabot alerts and routine updates.
- **Docker Build Workflow**: Updated `actions/upload-artifact` to v7.
- **Dockerfile**: Fixed linting errors (DL3003, DL3042) and improved caching efficiency by avoiding `cd` and using `npm cache clean`.

### Fixed
- **Docker Linting**: Resolved multi-stage build lint errors related to directory changes and cache management in both builder and runtime stages.

## [0.5.1] - 2026-03-01

### Fixed
- **Immich Auto-Sync**: Fixed automatic sync cron job failing with HTTP 404 due to incorrect API route path.
- **Plate Solving Error Messages**: Improved error messages for failed plate solving jobs with actionable context (e.g., incorrect scale hints, expired jobs).
- **Plate Solving Null Jobs**: Smarter handling of null Astrometry.net jobs — distinguishes between still-processing and truly failed submissions.
- **Notification Badge**: Header notification badge now updates instantly when alerts are acknowledged in admin.
- **Image Deletion Cascade**: Deleting an image now properly cascades to plate solving jobs, equipment links, and acquisition entries.
- **Sync Metadata Errors**: Sync-metadata errors now show actionable messages instead of generic failures.

### Added
- **Astrometry.net Links**: Plate solving job details now include direct links to Astrometry.net submission and annotated result pages.
- **Gallery Auto-Refresh**: Gallery automatically refreshes after a successful Immich sync.

### Changed
- **CI**: Removed `latest` tag from main branch Docker builds.
- **Sync Error Messages**: Improved error messages during metadata sync to Immich.

## [0.5.0] - 2026-02-28

### Added
- **Equipment Catalog & Management**: Full equipment system with type-specific specification fields (focal length/aperture for telescopes, sensor type/pixel size for cameras, etc.) and custom field support.
- **Per-Filter Acquisition Tracking**: New acquisition editor for recording sub-exposure details per filter, including frame count, exposure time, gain/ISO, binning, sensor temp, and date.
- **Auto-Computed Image Summaries**: Total integration time, frame count, and filter lists are automatically computed from acquisition entries and linked equipment.
- **Location Management**: Interactive map picker for managing imaging locations.
- **Advanced Search Filters**: New search and filtering capabilities in the UI.

### Changed
- **Immich Sync**: Replaced multi-endpoint fallback sync with paginated `/api/search/metadata` for reliable full-library sync across all Immich versions.
- **Tag Filtering**: Extracted shared tag filtering logic into a reusable module; plate solving tags are now filtered consistently across sync, XMP sidecars, and the tags API.
- **Equipment Manager**: Replaced generic key/value specs with structured fields per equipment type, plus custom field support.
- **Technical Details**: Replaced the manual technical details editor with the acquisition editor for structured per-filter data entry.
- **Database Schema**: Updated to support locations, acquisitions, and enhanced metadata; migrations run automatically on startup.
- **Themed UI Components**: Replaced native select elements with themed Shadcn components.

### Fixed
- **Immich Sync Pagination**: Library sync no longer silently caps at 5000 assets; properly paginates through all results.
- **Immich Non-Album Sync**: Resolved sync issues when not using album-based sync.
- **Equipment Settings Removal**: Fixed a bug where removing image-specific equipment settings would not persist after reload.
- **Acquisition Save Errors**: Added visible error messages when saving acquisition entries fails.

### Security
- **Rollup Dependency**: Overrode Rollup to v4.59.0 to address security vulnerabilities.
- **Minimatch ReDoS**: Overrode minimatch to >=10.2.3 to fix ReDoS vulnerability from combinatorial backtracking.

## [0.4.1] - 2026-02-26

### Added
- **Visual Image Renaming**: Ability to set a custom display title for images without changing the underlying system filename.
- **PUID/PGID Support**: Support for remapping the container user ID and group ID to match host volume permissions (standard for Unraid and Linux environments).

### Changed
- **Themed UI Components**: Replaced native select and input elements with themed Shadcn components for a consistent visual identity.

### Fixed
- **Permissions**: Resolved `EACCES` errors when creating date-organized sidecar directories in Docker by supporting UID/GID remapping.

### Security
- **Rollup Dependency**: Overrode Rollup version to v4.59.0 to address multiple security vulnerabilities.

## [0.4.0] - 2026-02-26

### Added
- **Interactive Sky Map**: A high-fidelity celestial atlas powered by Aladin Lite v3 for visualizing your plate-solved image collection.
- **Image Deep Linking**: Added `?image=ID` URL parameter support to open specific image overlays directly from the sky map or shared links.
- **Pleiades (M45) Test Data**: Added high-accuracy coordinate data for Pleiades to development seed scripts.
- **Automatic GHCR Pruning**: Weekly GitHub Action to automatically clean up old or untagged Docker images from the container registry.

### Changed
- **Aladin Lite v3**: Upgraded to the latest Aladin Lite engine for improved performance and WebGL2 support.
- **Coordinate Precision**: Standardized internal coordinate storage to decimal degree strings for accurate map plotting.
- **Navigation Cleanup**: Removed unimplemented "Collections" link from the sidebar.

### Fixed
- **WebGL Detection**: Added browser capability detection with user-friendly error messages for unsupported environments.
- **Global UI Tweaks**: Added `cursor: pointer` to all button elements for better interactivity feedback.

## [0.3.0] - 2026-02-25

### Added
- **XMP Sidecar Generation**: Automatic generation of astronomical metadata sidecars for plate-solved images.
- **Date-based Organization**: Option to organize sidecar files in `YYYY-MM/` subdirectories.
- **Sidecar Download API**: Endpoint to download generated XMP files directly from the gallery.
- **Admin Configuration**: New settings panel for XMP sidecar output paths and organization rules.

### Changed
- **EXIF Extraction**: Improved lens and telescope detection from Immich metadata to auto-populate equipment fields.
- **Worker Robustness**: Enhanced plate solving worker with better error recovery and continuous polling logic.

## [0.2.0] - 2025-07-06

### Added
- **Docker Multi-stage Builds**: Optimized production-ready container images with multi-architecture support.
- **UnRAID Integration**: Dedicated templates for easy deployment on home servers.
- **PostgreSQL Support**: Full support for production-scale databases while maintaining SQLite for development.
- **Worker Management**: Fine-grained control over the plate solving background process via the UI.
- **Health Checks**: Added container health check endpoints for monitoring.

### Changed
- **Monorepo Structure**: Reorganized codebase into `/apps/` and `/packages/` for better maintainability.
- **Configuration Service**: Enhanced to prioritize database settings over environment variables.

### Fixed
- **Thumbnail Proxy**: Fixed 500 errors by ensuring proper configuration service integration.
- **Security Vitals**: Removed all hardcoded secrets and transitioned to secure environment variables.

### Security
- **SSRF Protection**: Added protocol and host validation for all external API integrations.
- **Non-root Execution**: Transitioned Docker containers to run as a dedicated user.

## [0.1.0] - 2025-01-27

### Added
- **🎉 Initial Release**: Core functionality including Immich synchronization and image management.
- **Plate Solving**: Astrometry.net integration for automatic celestial coordinate detection.
- **Equipment Catalog**: Manage telescopes, cameras, and accessories.
- **Deep Zoom Viewer**: OpenSeaDragon integration for high-resolution exploration.
- **Real-time Updates**: WebSocket (Socket.io) support for live processing status.
- **Cron Scheduling**: Automated synchronization tasks.
