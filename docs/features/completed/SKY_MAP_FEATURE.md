# Sky Map Feature

## Overview

An interactive sky atlas that plots plate-solved images on a full-sky map using Aladin Lite. Each marker represents an image's RA/Dec position, letting astrophotographers visualize their sky coverage and quickly find images by location.

**No schema changes required.** Uses existing `ra`, `dec`, and `plateSolved` columns from plate solving results.

## Implementation Order

This is **Feature 4** of 4 (most isolated). It introduces an external dependency (Aladin Lite via CDN) but has no schema changes and doesn't depend on any other new features.

---

## External Dependency: Aladin Lite v3

[Aladin Lite](https://aladin.cds.unistra.fr/AladinLite/) is a lightweight sky atlas viewer developed by CDS Strasbourg. Loaded via CDN — no npm package needed.

### CDN URL

Aladin Lite v3 bundles CSS into the JS — only one script tag is needed:

```html
<script type="text/javascript" src="https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js" charset="utf-8"></script>
```

**No separate CSS file required** (unlike v2).

### TypeScript Integration

Since Aladin Lite doesn't have TypeScript types, declare the global:

```typescript
declare global {
  interface Window {
    A: any;
  }
}
```

The `A` global is the Aladin Lite API entry point, providing:
- `A.aladin(container, options)` — initialize the viewer
- `A.catalog(options)` — create a marker catalog
- `A.marker(ra, dec, options)` — create a marker

### Initialization Pattern

```typescript
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js';
  script.charset = 'utf-8';
  script.onload = () => {
    window.A.init.then(() => {
      const aladin = window.A.aladin('#aladin-container', {
        survey: 'P/DSS2/color',
        fov: 180,
        projection: 'AIT', // Aitoff projection for full sky
      });
      // Add markers, register objectClicked handler...
    });
  };
  script.onerror = () => {
    // Show error state
  };
  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
}, []);
```

---

## Backend

### New File: `apps/server/src/routes/sky-map.ts`

**Route:** `GET /api/sky-map/markers`

Returns plate-solved images with their sky coordinates and metadata.

### Response Shape

```typescript
Array<{
  id: number;
  title: string;
  ra: string;       // Right Ascension in decimal degrees
  dec: string;      // Declination in decimal degrees
  thumbnailUrl: string | null;
  objectType: string | null;
  constellation: string | null;
  fieldOfView: string | null;
}>
```

### Filtering Logic

Only return images where:
- `plateSolved === true`
- `ra` is not null/empty
- `dec` is not null/empty

### RA/Dec Format

The `ra` and `dec` values stored in the database come from Astrometry.net plate solving results. They are stored as text strings. Aladin Lite expects decimal degrees, so the frontend parses them with `parseFloat()`.

### Registration

Add to `apps/server/src/routes/index.ts`:
```typescript
import skyMapRoutes from './sky-map';
// ...
app.use('/api/sky-map', skyMapRoutes);
```

---

## Frontend

### New File: `apps/client/src/pages/sky-map.tsx`

### Components Used

- `Header` — existing site header
- `Card`, `CardContent` — shadcn card for the custom popup overlay
- `Badge` — for object type and constellation tags in popup
- `Loader2` — loading spinner while Aladin loads
- `Map`, `X` — lucide-react icons

### Layout

```
┌─────────────────────────────────────────────┐
│ Header                                       │
├─────────────────────────────────────────────┤
│ Page Title: "Sky Map" · "X objects plotted"  │
├─────────────────────────────────────────────┤
│                                              │
│   Aladin Lite Sky Atlas (full remaining      │
│   viewport height)                           │
│                                              │
│     * M42           ┌──────────────┐         │
│          * M31      │ Custom Popup │         │
│   * NGC 7000        │ [thumbnail]  │         │
│                     │ Title        │         │
│                     │ Type · Const │         │
│                     │ [View Image] │         │
│                     └──────────────┘         │
│                                              │
└─────────────────────────────────────────────┘
```

### Data Fetching

```typescript
const { data: markers = [], isLoading } = useQuery({
  queryKey: ["/api/sky-map/markers"],
});
```

### Marker Plotting

Once Aladin is initialized and markers are loaded:

```typescript
const catalog = window.A.catalog({ name: 'My Images', sourceSize: 18, color: '#3b82f6' });
aladin.addCatalog(catalog);

markers.forEach(marker => {
  const ra = parseFloat(marker.ra);
  const dec = parseFloat(marker.dec);
  if (!isNaN(ra) && !isNaN(dec)) {
    const source = window.A.marker(ra, dec, {
      popupTitle: marker.title,
      popupDesc: '',  // We use custom popup instead
    });
    source.data = marker; // Attach full marker data for objectClicked handler
    catalog.addSources([source]);
  }
});
```

### Custom Popup (React overlay via `objectClicked`)

Instead of Aladin's built-in popup (which only renders static HTML strings), we use the `objectClicked` event to show a custom React card overlay. This lets us:
- Match the app's design system (shadcn Card, Badge components)
- Show the image thumbnail from the proxy endpoint
- Link directly to the image in the gallery
- Have a dismiss button

```typescript
aladin.on('objectClicked', (object) => {
  if (object) {
    setSelectedMarker(object.data); // React state
  } else {
    setSelectedMarker(null); // Clicked empty sky → dismiss
  }
});
```

The popup is a positioned `Card` rendered as a React component, absolutely positioned over the Aladin container. It shows:
- **Thumbnail**: proxied via `/api/assets/thumbnail/:immichId` or `thumbnailUrl`
- **Title**: image title
- **Badges**: object type, constellation
- **Field of view**: if available
- **"View Image" link**: navigates to `/?search=<title>` to find the image in the gallery
- **Close button**: X icon to dismiss

### Loading State

Show a centered `Loader2` spinner while:
1. The Aladin Lite script is loading from CDN
2. The markers API request is in flight

Once both are ready, initialize the viewer and plot markers.

---

## Routing

Add to `apps/client/src/App.tsx`:
```typescript
import SkyMapPage from "./pages/sky-map";
// ...
<Route path="/sky-map" component={SkyMapPage} />
```

## Navigation

"Sky Map" appears as a **top-level link** in the header nav bar (direct `<Link>`, not in a dropdown).

---

## Testing

### E2E Tests: `tests/e2e/sky-map.spec.ts`

Following the existing Playwright + Page Object Model pattern.

### Page Object: `tests/e2e/pages/SkyMapPage.ts`

Extends `BasePage` with locators for:
- Page title
- Aladin container
- Loading spinner
- Empty state message
- Marker popup card (if visible)

### Test Fixtures: `tests/e2e/fixtures/sky-map.ts`

Mock data for `/api/sky-map/markers` responses:
- Array of plate-solved images with RA/Dec coordinates
- Empty array for no-data scenario

### Test Cases

1. **Page loads and shows title** — navigate to `/sky-map`, verify heading visible
2. **Loading state** — verify spinner shows while data loads
3. **Empty state** — mock empty markers response, verify empty state message with link to plate solving
4. **Markers plotted** — mock markers response, verify Aladin container is rendered (can't verify marker positions in E2E, but verify container initialized)
5. **Popup on marker click** — if markers exist, verify popup card appears with expected content
6. **Navigation** — verify Sky Map link in header navigates correctly

---

## Edge Cases

- **No plate-solved images**: Show a message "No plate-solved images to display. Plate solve your images to see them on the sky map." with a link to `/plate-solving`
- **Invalid RA/Dec**: Skip markers where `parseFloat` returns `NaN`
- **CDN unavailable**: Show an error message if the Aladin script fails to load (handle `script.onerror`)
- **Large collections**: Aladin Lite handles thousands of markers efficiently via its catalog system

---

## Verification

1. `npm run check` — no type errors
2. `npm run test:e2e` — sky map tests pass
3. Navigate to `/sky-map` — page loads without errors
4. Aladin Lite viewer initializes with DSS2 color survey
5. Markers appear at correct RA/Dec positions for plate-solved images
6. Clicking a marker shows custom React popup with thumbnail, metadata, and link
7. Clicking empty sky or close button dismisses popup
8. Non-plate-solved images are excluded
9. Empty state message shown when no plate-solved images exist
10. Loading spinner shows while CDN script loads
