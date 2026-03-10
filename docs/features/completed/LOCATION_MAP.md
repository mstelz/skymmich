# Location Map Integration

## Problem
Typing latitude and longitude manually is not feasible for adding imaging locations. There is no frontend UI for location management at all.

## Current State
- Backend CRUD routes exist (`apps/server/src/routes/locations.ts`): GET, POST, PATCH, DELETE
- Database schema has `locations` table with: id, name, latitude, longitude, altitude, description, timestamps
- No frontend page or component for locations
- No map integration anywhere for terrestrial coordinates

## Solution
Build a locations page with an interactive Leaflet + OpenStreetMap map for visual coordinate picking.

### Dependencies
- `leaflet` and `react-leaflet` npm packages
- `@types/leaflet` for TypeScript support
- No API key needed (OpenStreetMap is free)

### Locations Page (`apps/client/src/pages/locations.tsx`)
- Split view: location list on the left, map on the right
- Map shows all saved locations as markers
- Click on map to place a new location marker
- Reverse geocoding via Nominatim API (free, no key) to suggest location names from coordinates
- Each location card shows: name, coordinates, altitude, description, edit/delete buttons

### Map Picker Component (`apps/client/src/components/location-picker.tsx`)
- Reusable Leaflet map component
- Props: initial center/zoom, markers array, onLocationSelect callback
- Click-to-place mode for adding locations
- Draggable markers for editing location coordinates
- Search box for finding locations by name (Nominatim forward geocoding)

### Image Overlay Integration
- Add location selector dropdown in image overlay (pick from saved locations)
- Show location name and mini-map preview when a location is assigned to an image

### Navigation
- Add "Locations" link to sidebar navigation

## Files
- `apps/client/src/pages/locations.tsx` (new)
- `apps/client/src/components/location-picker.tsx` (new)
- `apps/client/src/components/sidebar.tsx` (nav link)
- `apps/client/src/components/image-overlay.tsx` (location selector)
- `package.json` (new dependencies)
