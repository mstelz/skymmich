# Changelog

All notable changes to Skymmich will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-02-27

### Added
- **Type-Specific Equipment Fields**: Equipment types now have known specification fields (e.g., focal length and aperture for telescopes, sensor type and pixel size for cameras) with the ability to add custom fields.
- **Per-Filter Acquisition Tracking**: New acquisition editor for recording sub-exposure details per filter, including frame count, exposure time, gain/ISO, binning, sensor temp, and date.
- **Auto-Computed Image Summaries**: Total integration time, frame count, and filter lists are automatically computed from acquisition entries and linked equipment.
- **Locations API**: New endpoint for managing imaging locations.

### Changed
- **Equipment Manager**: Replaced generic key/value specs with structured fields per equipment type, plus custom field support.
- **Technical Details**: Replaced the manual technical details editor with the acquisition editor for structured per-filter data entry.
- **Database Migrations**: Migrations now always run on startup, allowing new tables to be added to existing databases automatically.

### Fixed
- **Equipment Settings Removal**: Fixed a bug where removing image-specific equipment settings would not persist after reload.
- **Acquisition Save Errors**: Added visible error messages when saving acquisition entries fails.

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
