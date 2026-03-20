# Deep Sky Catalog & Targets Feature

## Overview

A comprehensive celestial catalog integration that provides a target-centric view of your astrophotography. Instead of just grouping by image title, this feature leverages a real-world database of deep-sky objects (DSO) to provide canonical target identification, advanced filtering, and automated survey previews.

## Key Components

### 1. Deep Sky Catalog Integration
- **Database**: Integrated NGC/IC and Messier catalog data.
- **Auto-Matching**: During plate solving, images are automatically matched against the catalog based on coordinates and tags.
- **Backfill**: Administrative tool to re-match existing images against the updated catalog.

### 2. Targets Page
- **Advanced Filtering**:
  - Search by name or common aliases.
  - Multi-select object types (Galaxy, Planetary Nebula, etc.).
  - Filter by constellation.
  - Magnitude range filtering.
  - Minimum size filtering (arcmin).
  - Messier-only toggle.
  - User-defined tag filtering.
- **Intelligent Sorting**:
  - **Best Now**: Ranks targets based on their current altitude and observability for the user's location.
  - Magnitude, Size, and Name sorting.
- **Visibility Tracking**: Integrates with managed locations to hide targets currently below the horizon.

### 3. Automated Survey Thumbnails
- **Aladin Integration**: Automatically fetches survey previews (DSS2 color) from Aladin Lite (hips2fits) for all catalog objects.
- **Local Caching**: Survey images are cached locally to reduce API load and improve page performance.
- **Representative Thumbnails**: For targets you've already imaged, the page shows your own work as the primary thumbnail.

### 4. Target Picker & Manual Overrides
- **Target Picker Modal**: Easily search the catalog and assign a target to an image from the gallery overlay.
- **Custom Targets**: Support for custom target names when an object isn't in the standard catalogs.

## Backend Implementation

### Services
- **`CatalogService`**: Manages the database of objects, coordinate conversions, and advanced query logic (including "Best Now" ranking).
- **`AstrometryService`**: Updated to perform auto-matching after successful plate solving.

### Routes
- **`GET /api/catalog/browse`**: Paginated, server-filtered catalog browsing.
- **`GET /api/catalog/thumbnail/:name`**: Proxied and cached survey thumbnails.
- **`PATCH /api/images/:id`**: Updated to allow setting `targetName`.

## Frontend Implementation

- **`TargetsPage`**: A new high-performance page using React Query for paginated data and local filtering for user-specific imaged states.
- **`TargetPickerModal`**: Interactive search and assignment tool.
- **`TargetDetailDialog`**: Comprehensive view of a target's metadata and your imaging history for it.

## Infrastructure

- **Docker**: Added `/app/cache/thumbnails` volume for persistent thumbnail storage.
- **Environment Variables**:
  - `THUMBNAIL_CACHE_DIR`: Customizable path for cached images.
