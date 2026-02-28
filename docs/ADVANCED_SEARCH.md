# Advanced Search

## Problem
The "Advanced" search button on the gallery page exists but does nothing when clicked.

## Current State
- Button in `search-filters.tsx` has no click handler
- Existing filters: object type, constellation, plate solved status, text search, tags
- All filters are applied server-side via query params to `GET /api/images`
- Backend `getAstroImages()` supports: objectType, tags, plateSolved, constellation

## Solution
Implement an advanced search panel that slides open or appears as a modal with additional filter options.

### New Filter Options
- **Equipment**: Select from equipment catalog (filter by images using specific gear)
- **Date range**: Filter by capture date or upload date (min/max)
- **Integration time**: Min/max total integration hours
- **Focal length**: Min/max range
- **Has acquisition data**: Yes/No toggle
- **Location**: Select from saved locations (if any exist)

### Frontend
- **`apps/client/src/components/search-filters.tsx`** (or new `advanced-search.tsx`): Advanced search panel/modal component with the above fields
- **`apps/client/src/pages/home.tsx`**: Wire up advanced filters to the filters state, pass to API

### Backend
- **`apps/server/src/routes/images.ts`**: Accept new query params (equipmentId, dateFrom, dateTo, minIntegration, maxIntegration, minFocalLength, maxFocalLength, hasAcquisitions, locationId)
- **`apps/server/src/services/storage.ts`**: Extend `getAstroImages()` with new filter conditions using SQL joins and WHERE clauses

## Dependencies
- Active filter indication (FILTER_INDICATION.md) needed to display applied advanced filters
- Equipment filter (GALLERY_EQUIPMENT_FILTER.md) shares the equipmentId filter logic
