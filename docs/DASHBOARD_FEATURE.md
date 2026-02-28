# Dashboard / Stats Feature

## Overview

A read-only analytics dashboard that aggregates existing image data into summary statistics and interactive charts. Gives astrophotographers an at-a-glance view of their collection — total imaging hours, equipment usage, target distribution, and activity over time.

**No schema changes required.** Pure aggregation over existing `astrophotography_images` and `equipment` tables.

## Implementation Order

This is **Feature 1** of 4 in the feature expansion plan. It should be implemented first because it has zero schema changes and uses existing Recharts/shadcn chart infrastructure.

---

## Backend

### New File: `apps/server/src/routes/dashboard.ts`

**Route:** `GET /api/dashboard/stats`

Fetches all images via `storage.getAstroImages()` and all equipment via `storage.getEquipment()`, then aggregates in-memory:

### Response Shape

```typescript
{
  summary: {
    totalImages: number;
    totalIntegrationHours: number;
    equipmentCount: number;
    plateSolveRate: number; // percentage 0-100
  };
  integrationByMonth: Array<{
    month: string; // "2024-01", "2024-02", etc.
    hours: number;
  }>;
  imagesByObjectType: Array<{
    type: string; // "Galaxy", "Nebula", "Cluster", etc.
    count: number;
  }>;
  topConstellations: Array<{
    constellation: string;
    count: number;
  }>;
  equipmentUsage: Array<{
    name: string;
    type: string; // "telescope", "camera", etc.
    count: number;
  }>;
  activityDates: Array<{
    date: string; // "2024-01-15"
    count: number;
  }>;
  topTargets: Array<{
    name: string;
    count: number;
  }>;
}
```

### Aggregation Logic

- **totalIntegrationHours**: Sum of all `totalIntegration` values (already in hours)
- **plateSolveRate**: `(images with plateSolved=true / total images) * 100`
- **integrationByMonth**: Group images by `captureDate` year-month, sum `totalIntegration` per group
- **imagesByObjectType**: Group by `objectType`, count per group (skip null/empty)
- **topConstellations**: Group by `constellation`, count, sort descending, take top 10
- **equipmentUsage**: Count occurrences of each unique `telescope` and `camera` value across images
- **activityDates**: Group by `captureDate` date portion, count images per date
- **topTargets**: Group by `title` (or `targetName` once Feature 2 lands), count, sort descending, take top 10

### Registration

Add to `apps/server/src/routes/index.ts`:
```typescript
import dashboardRoutes from './dashboard';
// ...
app.use('/api/dashboard', dashboardRoutes);
```

---

## Frontend

### New File: `apps/client/src/pages/dashboard.tsx`

Uses the same page layout pattern as `plate-solving.tsx` (Header + main content area).

### Components Used

- `Header` — existing site header
- `Card`, `CardContent`, `CardHeader`, `CardTitle` — shadcn card components
- `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` — from `components/ui/chart.tsx`
- `BarChart`, `Bar`, `PieChart`, `Pie`, `Cell`, `XAxis`, `YAxis`, `CartesianGrid`, `ResponsiveContainer` — from `recharts`
- `Loader2` — loading spinner from lucide-react

### Layout

```
┌─────────────────────────────────────────────┐
│ Header                                       │
├─────────────────────────────────────────────┤
│ Page Title: "Dashboard"                      │
├────────┬────────┬────────┬──────────────────┤
│ Total  │ Total  │ Equip  │ Plate Solve      │
│ Images │ Hours  │ Count  │ Rate             │
├────────┴────────┴────────┴──────────────────┤
│ Integration by Month (BarChart)              │
├──────────────────────┬──────────────────────┤
│ Object Types (Pie)   │ Top Constellations   │
├──────────────────────┴──────────────────────┤
│ Equipment Usage (BarChart)                   │
├─────────────────────────────────────────────┤
│ Activity Calendar (CSS grid)                 │
└─────────────────────────────────────────────┘
```

### Data Fetching

```typescript
const { data: stats, isLoading } = useQuery({
  queryKey: ["/api/dashboard/stats"],
});
```

### Activity Calendar

A CSS grid of small colored cells representing each date in the past year. Color intensity maps to image count for that date (GitHub contribution graph style). Implemented as a simple div grid — no external library needed.

---

## Routing

Add to `apps/client/src/App.tsx`:
```typescript
import DashboardPage from "./pages/dashboard";
// ...
<Route path="/dashboard" component={DashboardPage} />
```

## Navigation

Add "Dashboard" as a direct `<Link>` in the header nav bar (not inside a dropdown), between "Gallery" and the "Explore" dropdown.

---

## Verification

1. `npm run check` — no type errors
2. Navigate to `/dashboard` — page loads without errors
3. Summary cards show correct counts matching the gallery
4. Charts render with existing data (bar chart, pie chart)
5. Activity calendar shows colored cells on dates with images
6. Empty state: if no images exist, show "No data yet" message instead of empty charts
