# Active Filter Indication

## Problem
There is no visual indication of which filters are currently applied in the gallery. Clicking tags creates filters but users can't see what's active or clear individual filters.

## Current State
- Filters stored in React state in `home.tsx`: objectType, tags[], plateSolved, constellation, search
- Select dropdowns show their current value but tags have no visual indicator
- No "Clear All" or "Clear filter" mechanism exists
- No filter count shown

## Solution
Add an active filters bar below the search/filter row that shows all currently applied filters as removable chips.

### Frontend (`apps/client/src/components/search-filters.tsx`)
Add a new section below the existing filter row:
- Render a chip/badge for each active filter:
  - Object type (e.g., "Type: Deep Sky")
  - Constellation (e.g., "Constellation: Orion")
  - Plate solved status (e.g., "Plate Solved: Yes")
  - Each active tag (e.g., "Tag: narrowband")
  - Search text (e.g., "Search: M42")
  - Equipment filter (e.g., "Equipment: RedCat 51") — from GALLERY_EQUIPMENT_FILTER.md
- Each chip has an X button to remove just that filter
- "Clear All" button appears when any filters are active
- Result count shown (e.g., "Showing 8 of 24 images")

### Frontend (`apps/client/src/pages/home.tsx`)
- Pass `totalCount` (all images) and `filteredCount` to SearchFilters for result count display

## Files
- `apps/client/src/components/search-filters.tsx`
- `apps/client/src/pages/home.tsx`
