# Equipment Enhancements

This document describes two planned enhancements to the equipment management system: cost/acquisition tracking on equipment items, and equipment groups for bulk image assignment.

## Feature 1: Cost & Acquisition Date

### Overview

Add optional `cost` and `acquisition_date` fields to the equipment table, allowing users to track when equipment was purchased and how much it cost. These are first-class columns on the `equipment` table (not stored inside the JSON `specifications` blob).

### Database Schema

Add two nullable columns to the `equipment` table:

```sql
-- SQLite (two separate ALTER statements required)
ALTER TABLE `equipment` ADD `cost` real;
ALTER TABLE `equipment` ADD `acquisition_date` integer;

-- Postgres
ALTER TABLE equipment ADD COLUMN cost real;
ALTER TABLE equipment ADD COLUMN acquisition_date timestamptz;
```

Drizzle ORM schema additions on the `equipment` table:

```typescript
// SQLite
cost: real('cost'),
acquisitionDate: integer('acquisition_date', { mode: 'timestamp' }),

// Postgres
cost: real('cost'),
acquisitionDate: timestamp('acquisition_date'),
```

No data backfill is required — existing rows will have `NULL` for both fields.

### API Changes

The existing equipment CRUD endpoints accept the new fields:

- `POST /api/equipment` — accepts optional `cost` (number) and `acquisitionDate` (ISO date string)
- `PUT /api/equipment/:id` — accepts optional `cost` and `acquisitionDate`
- `GET /api/equipment` — returns `cost` and `acquisitionDate` on each equipment item

No new endpoints are needed.

### UI Changes

**Equipment Catalog Page** (`/equipment`):

- Add/Edit forms gain two new fields:
  - **Purchase Price** — numeric input with step 0.01
  - **Acquisition Date** — date picker
- Equipment cards display cost and acquisition date when present

---

## Feature 2: Equipment Groups

### Overview

Equipment groups are named sets of equipment items (e.g., "Main Imaging Rig", "Widefield Setup") that can be applied to an image in a single action, replacing the need to assign each piece of equipment individually.

Most astrophotography sessions use the same core gear — telescope, camera, mount, and accessories. Groups make it fast to assign the full setup to an image at once.

### Design Decisions

- **Groups are convenience shortcuts** — applying a group creates individual `image_equipment` rows, identical to manual assignment. Groups do not replace or alter the existing assignment model.
- **Filters are excluded by convention** — filters change per-session and are better tracked in acquisition details. The UI de-emphasizes filter-type equipment in the group member picker, but does not hard-block it.
- **Groups are catalog-level templates** — they are not tied to sessions or images. A group is just a reusable list of equipment.
- **Applying a group is idempotent** — equipment already assigned to the image is skipped.
- **Deleting a group does not affect existing assignments** — only the group definition and its member list are removed.

### Database Schema

Two new tables:

```sql
-- equipment_groups: the group definition
CREATE TABLE `equipment_groups` (
  `id` integer PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- equipment_group_members: junction table linking groups to equipment items
CREATE TABLE `equipment_group_members` (
  `id` integer PRIMARY KEY NOT NULL,
  `group_id` integer NOT NULL,
  `equipment_id` integer NOT NULL,
  `created_at` integer NOT NULL
);
```

Drizzle ORM schemas:

```typescript
// SQLite
export const equipmentGroups = sqliteTable('equipment_groups', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const equipmentGroupMembers = sqliteTable('equipment_group_members', {
  id: integer('id').primaryKey(),
  groupId: integer('group_id').notNull(),
  equipmentId: integer('equipment_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
```

Postgres schema follows the same structure with `serial` primary keys, `timestamp` columns, and `references()` for foreign keys with `onDelete: 'cascade'`.

### API Endpoints

New route group at `/api/equipment-groups`:

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/equipment-groups` | List all groups with members hydrated |
| `POST` | `/api/equipment-groups` | Create a group (body: `{ name, description?, memberIds? }`) |
| `GET` | `/api/equipment-groups/:id` | Get a single group with members |
| `PUT` | `/api/equipment-groups/:id` | Update group name/description |
| `DELETE` | `/api/equipment-groups/:id` | Delete group and its member rows |
| `PUT` | `/api/equipment-groups/:id/members` | Replace group membership (body: `{ memberIds: number[] }`) |
| `POST` | `/api/equipment-groups/:id/apply/:imageId` | Apply group to an image (bulk-assign all members) |

The `apply` endpoint inserts `image_equipment` rows for each group member not already assigned to the image and returns the list of newly added equipment.

### UI Changes

**Equipment Catalog Page** (`/equipment`):

A new "Equipment Groups" section below the equipment list:

- List of existing groups, each showing name, description, and member equipment as type-colored badges
- "Add New Group" form with name, description, and a multi-select equipment picker
- Edit and delete actions on each group
- The member picker de-emphasizes filter-type equipment with a note that filters are better tracked in acquisition details

**Image Equipment Manager** (overlay panel):

A new "Apply Group" button alongside the existing "Add Existing" and "Quick Add New" options:

- Selecting "Apply Group" shows a dropdown of available groups
- Selecting a group shows a preview of its members, with already-assigned equipment marked as "(already assigned)"
- Confirming calls the apply endpoint and refreshes the equipment list

### Example Usage

1. User creates a group "Main Imaging Rig" with: WO RedCat 51 (telescope), ASI2600MC (camera), EQ6-R Pro (mount)
2. User opens an image in the overlay, clicks "Edit" in the equipment section
3. User clicks "Apply Group" and selects "Main Imaging Rig"
4. All three pieces of equipment are assigned to the image at once
5. User can still individually add/remove equipment or adjust per-image settings as before

### Data Model Diagram

```
equipment_groups
    ↕ many-to-many via equipment_group_members
equipment (catalog)
    ↕ many-to-many via image_equipment (with per-image settings/notes)
astrophotography_images
```

Groups are purely a catalog-level concept. The `image_equipment` junction table remains the sole link between equipment and images.

---

## Migration Strategy

Both features are additive schema changes (new columns and new tables). No existing data is modified.

Recommended migration order:
1. `0005_equipment_cost_date.sql` — two `ALTER TABLE` statements for cost and acquisition_date
2. `0006_equipment_groups.sql` — two `CREATE TABLE` statements for equipment_groups and equipment_group_members

The migrator in `apps/server/src/db.ts` runs automatically on startup.

## Future Considerations

- Equipment group usage statistics (which groups are most used)
- Default group setting for new images
- Group-level notes or default per-image settings
- Session-level group assignment (when sessions feature matures)
