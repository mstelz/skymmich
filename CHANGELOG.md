# Changelog

All notable changes to Skymmich will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-03-22

### Changed
- **Server Framework**: Migrated from Express to Hono with `@hono/node-server` for HTTP routing. All 13 route files converted to Hono's context-based handler API.
- **HTTP Client**: Replaced axios with native `fetch` across all server services and routes. Uses `AbortSignal.timeout()` for request timeouts and native `FormData` for multipart uploads.
- **WebSocket**: Replaced Socket.IO with native WebSocket using the `ws` package on the server and browser-native `WebSocket` on the client. Added automatic reconnection with exponential backoff.
- **Asset Proxy**: Immich asset proxy now streams responses via `fetch()` passthrough instead of axios stream piping.
- **Mobile Navigation**: Added hamburger menu for mobile viewports. Navigation links, Sync Immich, and Admin Settings are accessible from a slide-out drawer on the right. Desktop header is unchanged.
- **Toast Position**: Toast notifications now appear at the bottom of the screen on mobile instead of the top.

### Removed
- **Dependencies**: Removed express, axios, form-data, socket.io, socket.io-client, cors, passport, passport-local, connect-pg-simple, memorystore, and their associated type packages.
- **Stale Overrides**: Removed `qs` and `socket.io-parser` npm overrides that were only needed for Express/Socket.IO transitive dependencies.

### Fixed
- **Missing Dependency**: Added `pg` as an explicit dependency. It was previously resolved as a transitive dependency of `connect-pg-simple`.
- **Connection Test Responses**: Added missing `success` field to Immich and Astrometry test connection responses so the frontend can correctly show green/red status styling.
- **Catalog Backfill Counter**: Fixed matched count never incrementing during catalog backfill.
- **Notification Timestamps**: Fixed field mismatch (`timestamp` → `createdAt`) in notification display.
- **Plate Solving Timeout**: Added 60-minute timeout to plate solving poll loop to prevent infinite hangs.
- **Remote Image URLs**: Fixed `RemoteImage` component stripping query parameters from image URLs.
- **Redacted Key Handling**: Properly handle redacted API keys in test connection and album endpoints to avoid overwriting stored keys.
- **Async File I/O**: Replaced blocking `readFileSync`/`writeFileSync` with async `fs` operations.
- **Astrometry HTTPS**: Changed all Astrometry.net API calls from HTTP to HTTPS.
- **API Key Masking**: Mask API keys in `GET /admin/settings` response, showing only the last 4 characters.
- **Database URL Redaction**: Redact `DATABASE_URL` password in Docker startup logs.
- **Stats Query**: Rewrote `getStats()` to use SQL aggregation instead of loading all rows into memory.
- **Dead Code Removal**: Removed unused `apiToken` localStorage code from the client.
- **Shared Notification Type**: Created shared `Notification` type, removing 3 duplicate interface definitions.
- **Immich Sync Refactor**: Extracted Immich image sync into a service layer; cron calls service directly.
- **Query Filters**: Replaced fragile positional `queryKey` array with typed `QueryFilters` object.
- **Schema Improvements**: Added missing foreign key references to SQLite schema and sync comments between pg and sqlite files.

## [0.7.2] - 2026-03-21

### Fixed
- **ReDoS Vulnerability**: Fixed polynomial regular expression in catalog name normalization that could cause denial-of-service with crafted input.
- **Thumbnail Path Safety**: Serve cached thumbnails via static middleware instead of manual file reads, delegating path safety to the framework.
- **Thumbnail Rate Limiting**: Added global throttle on external survey image fetches to prevent abuse of the upstream API.

## [0.7.1] - 2026-03-20

### Fixed
- **Docker Permissions**: Added `/app/cache` to startup permission management. This ensures that the container automatically handles ownership of survey images and thumbnails regardless of host environment or PUID/PGID settings.
- **Persistence**: Fixed missing cache volume mappings in production Docker Compose and Unraid templates.

## [0.7.0] - 2026-03-20

### Added
- **Deep Sky Catalog & Targets**: New "Targets" page for browsing and filtering astronomical objects (Messier and NGC/IC catalogs).
- **Advanced Target Filtering**: Search by name/aliases, multi-select object types, filter by constellation, magnitude range, and minimum size.
- **Survey Thumbnails**: Automatic DSS2 survey image previews from Aladin Lite (hips2fits) with local disk caching.
- **"Best Now" Sorting**: Intelligently rank targets based on current date and observer location to find what's best to image tonight.
- **Visibility Filtering**: Support for hiding targets currently below the horizon based on managed location coordinates.
- **Auto-Matching**: Automatically assign catalog targets to images after successful plate solving.
- **Target Picker Modal**: Interactive search tool to manually assign catalog targets to gallery images.
- **Backfill Administrative Tool**: New "Backfill Targets" button in Admin to re-match all existing plate-solved images against the catalog.
- **Immich Metadata Sync**: Full writeback of metadata to Immich, including image description, constellation, and celestial coordinates.
- **Metadata Configuration**: Granular admin toggles to enable/disable specific metadata fields for Immich sync.
- **Gallery Equipment Filter**: Clicking an equipment badge in the image overlay now automatically filters the gallery to show all images using that equipment.

### Changed
- **Header Navigation**: Added "Targets" to the main site navigation.
- **Dockerfile**: Added persistent cache directory for thumbnails (`/app/cache/thumbnails`).
- **App Layout**: Registered new `/targets` route and updated global UI components.
- **Persistence**: Added new `/app/cache` volume requirement. **Existing Docker and Unraid users should manually add this path mapping to ensure survey images and thumbnails persist across restarts.**

### Fixed
- **Thumbnail Cache**: Improved thumbnail serving performance via disk-based caching and immutable headers.
- **Plate Solving**: More robust target matching during the post-processing phase of plate solving jobs.

## [0.6.1] - 2026-03-19

### Fixed
- **PostgreSQL Migration**: Added missing `created_at` column to `equipment_group_members` table in PostgreSQL DDL.

### Security
- **socket.io-parser CVE**: Overrode socket.io-parser to >=4.2.6 to fix high-severity unbounded binary attachments vulnerability.
- **Docker Image**: Patched node-tar and zlib CVEs in Docker image.
- **Dockerfile Lint**: Added hadolint ignore for DL3002 since root is required for PUID/PGID remapping at startup.

### Changed
- **Dependencies**: Updated production dependencies (better-sqlite3, framer-motion, nanoid, openseadragon, react-resizable-panels).

## [0.6.0] - 2026-03-11

### Added
- **Equipment Groups**: Create named equipment groups (e.g., "Deep Sky Rig") to bundle telescopes, cameras, and accessories together for quick assignment to images.
- **Apply Group to Image**: Apply an equipment group to an image from the gallery overlay, with preview of members and duplicate detection.
- **Equipment Cost & Acquisition Date**: Track purchase cost and acquisition date for equipment items.
- **Real-time Notifications**: Notifications now use React Query with socket.io events for instant updates across tabs.

### Changed
- **Dependencies**: Updated production and development dependencies (axios, react-day-picker, react-resizable-panels, autoprefixer, @types/node).
- **GitHub Actions**: Updated docker/setup-buildx (v4), docker/login (v4), docker/metadata (v6), docker/build-push (v7), actions/upload-artifact (v7), aquasecurity/trivy-action (0.35.0).
- **Dockerfile**: Fixed linting errors (DL3003, DL3042) and improved caching efficiency.
- **Docs**: Consolidated feature documentation into `docs/features/` directory.

### Fixed
- **GHCR Prune**: Fixed image pruning workflow to preserve semver release tags.
- **Equipment Form**: Restructured form layout to row-based and improved dark mode contrast for inputs and labels.
- **Database**: Added missing `original_path` column to SQLite schema migration.

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
- **Initial Release**: Core functionality including Immich synchronization and image management.
- **Plate Solving**: Astrometry.net integration for automatic celestial coordinate detection.
- **Equipment Catalog**: Manage telescopes, cameras, and accessories.
- **Deep Zoom Viewer**: OpenSeaDragon integration for high-resolution exploration.
- **Real-time Updates**: WebSocket (Socket.io) support for live processing status.
- **Cron Scheduling**: Automated synchronization tasks.
