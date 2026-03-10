# Gallery Equipment Filter

## Problem
Clicking equipment badges in the image overlay does nothing. Users expect clicking on a piece of equipment (e.g., a telescope name) to filter the gallery to show all images captured with that equipment.

## Current State
- Equipment is displayed in the image overlay as cards grouped by type (telescope, camera, mount, etc.)
- No click handler on equipment items
- No `equipmentId` filter exists in the gallery filter system

## Solution
Clicking an equipment badge in the image overlay filters the gallery to show only images using that equipment.

### Frontend
- **`apps/client/src/pages/home.tsx`**: Add `equipmentId` and `equipmentName` to the filters state object. Pass to API query params.
- **`apps/client/src/components/image-overlay.tsx`**: Make equipment cards/badges clickable. On click: set `equipmentId` filter, close the overlay.
- **`apps/client/src/components/search-filters.tsx`**: Display active equipment filter in the filter indication bar (see FILTER_INDICATION.md).

### Backend
- **`apps/server/src/routes/images.ts`**: Accept `equipmentId` query param in `GET /api/images`.
- **`apps/server/src/services/storage.ts`**: In `getAstroImages()`, join through `image_equipment` table when `equipmentId` filter is present.

## Dependencies
- Depends on active filter indication UI (FILTER_INDICATION.md) to show which equipment filter is applied.
