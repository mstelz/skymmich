# Targets Feature

## Overview

A target-centric view that groups images by astronomical object (e.g., "M42", "NGC 7000"). Astrophotographers often image the same target across multiple sessions — this page consolidates all images of a given target into a single card showing total integration time, image count, and metadata.

**Requires a schema migration** to add a `targetName` column.

## Implementation Order

This is **Feature 2** of 4. Depends on a schema change, so it comes after Dashboard (which has zero schema changes). The `targetName` column provides a canonical grouping key separate from `title`.

---

## Schema Change

### Why `targetName`?

- `title` is the display name and may vary between sessions (e.g., "Orion Nebula", "M42 - Orion", "M42 LRGB")
- `targetName` is the canonical catalog name (e.g., "M42") used for grouping
- If `targetName` is null, the grouping logic falls back to `title`

### Migration

Add `targetName` column (nullable text) to both schema files:

**`packages/shared/src/db/pg-schema.ts`:**
```typescript
targetName: text('target_name'),
```

**`packages/shared/src/db/sqlite-schema.ts`:**
```typescript
targetName: text('target_name'),
```

Place the column after `constellation` and before `description` for logical ordering.

Generate migration:
```bash
npx drizzle-kit generate
```

Since the column is nullable, no data migration is needed — existing rows will have `targetName = null` and the grouping logic falls back to `title`.

---

## Backend

### New File: `apps/server/src/routes/targets.ts`

**Route:** `GET /api/targets`

Fetches all images via `storage.getAstroImages()` and groups by `targetName ?? title`.

### Response Shape

```typescript
Array<{
  targetName: string;
  imageCount: number;
  totalIntegrationHours: number;
  objectType: string | null;
  constellation: string | null;
  plateSolvedCount: number;
  thumbnailUrl: string | null;
  imageIds: number[];
}>
```

### Grouping Logic

```typescript
const groupKey = image.targetName || image.title;
```

For each group:
- `targetName`: the group key
- `imageCount`: number of images in the group
- `totalIntegrationHours`: sum of `totalIntegration` values
- `objectType`: most common `objectType` in the group (mode)
- `constellation`: most common `constellation` in the group (mode)
- `plateSolvedCount`: count of images with `plateSolved = true`
- `thumbnailUrl`: `thumbnailUrl` from the first image (representative)
- `imageIds`: array of image IDs in the group

Sort by `imageCount` descending by default.

### Registration

Add to `apps/server/src/routes/index.ts`:
```typescript
import targetRoutes from './targets';
// ...
app.use('/api/targets', targetRoutes);
```

---

## Frontend

### New File: `apps/client/src/pages/targets.tsx`

### Components Used

- `Header` — existing site header
- `Card`, `CardContent` — shadcn card components
- `Badge` — for object type and constellation tags
- `Input` — search box
- `Select` — filter dropdowns
- `Search`, `Crosshair`, `Clock` — lucide-react icons

### Layout

```
┌─────────────────────────────────────────────┐
│ Header                                       │
├─────────────────────────────────────────────┤
│ Page Title: "Targets"                        │
│ Subtitle: "X targets · Y total hours"       │
├─────────────────────────────────────────────┤
│ [Search by name...] [Object Type ▾] [Const ▾]│
├────────────┬────────────┬───────────────────┤
│ Target Card│ Target Card│ Target Card       │
│ ┌────────┐ │ ┌────────┐ │ ┌────────┐       │
│ │ thumb  │ │ │ thumb  │ │ │ thumb  │       │
│ └────────┘ │ └────────┘ │ └────────┘       │
│ M42        │ NGC 7000   │ M31              │
│ Nebula     │ Nebula     │ Galaxy           │
│ Orion      │ Cygnus     │ Andromeda        │
│ 5 images   │ 3 images   │ 8 images         │
│ 12.5 hrs   │ 6.2 hrs    │ 20.1 hrs         │
├────────────┴────────────┴───────────────────┤
│ ... more cards (responsive grid)             │
└─────────────────────────────────────────────┘
```

### Grid Responsiveness

- 1 column on mobile (`grid-cols-1`)
- 2 columns on medium (`md:grid-cols-2`)
- 3 columns on large (`lg:grid-cols-3`)

### Data Fetching

```typescript
const { data: targets = [], isLoading } = useQuery({
  queryKey: ["/api/targets"],
});
```

### Filtering

Client-side filtering on the fetched data:
- **Search**: filter by `targetName` (case-insensitive substring match)
- **Object Type**: dropdown with unique object types from the data
- **Constellation**: dropdown with unique constellations from the data

### Card Click Action

Clicking a target card navigates to the gallery filtered to that target:
```typescript
window.location.href = `/?search=${encodeURIComponent(target.targetName)}`;
```

---

## Routing

Add to `apps/client/src/App.tsx`:
```typescript
import TargetsPage from "./pages/targets";
// ...
<Route path="/targets" component={TargetsPage} />
```

## Navigation

"Targets" appears inside the **Explore** dropdown menu in the header nav.

---

## Verification

1. `npm run check` — no type errors after schema change
2. Migration generates cleanly with `npx drizzle-kit generate`
3. Navigate to `/targets` — page loads
4. Images without `targetName` group by `title` correctly
5. Search and filter controls work
6. Clicking a card navigates to filtered gallery
7. Empty state shown when no images exist
