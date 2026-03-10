# Equipment Page — Type-Specific Fields

## Problem
The standalone equipment page (`/equipment`) uses generic key/value for specifications, while the quick-add form in the image view uses structured, type-specific fields (focal length for telescopes, sensor type for cameras, etc.).

## Current State
- `EquipmentSpecFields` component exists in `equipment-manager.tsx` — renders known fields per equipment type plus custom key/value
- Uses `EQUIPMENT_SPEC_FIELDS` constant from `@shared/schema` which maps each EquipmentType to an array of field definitions
- `pages/equipment.tsx` has its own `AddEquipmentForm` and `EquipmentCard` components with manual key/value badge entry (no type-specific fields)

## Solution
Extract `EquipmentSpecFields` to a shared component file and reuse it on the equipment page.

### Extract Component
- **New file: `apps/client/src/components/equipment-spec-fields.tsx`**: Move `EquipmentSpecFields` component here (currently defined in `equipment-manager.tsx` lines 32-171)
- **`apps/client/src/components/equipment-manager.tsx`**: Import from new file instead of defining inline

### Update Equipment Page
- **`apps/client/src/pages/equipment.tsx`**:
  - In `AddEquipmentForm`: replace manual spec key/value section with `<EquipmentSpecFields>`
  - In `EquipmentCard` edit mode: replace manual spec key/value section with `<EquipmentSpecFields>`
  - Reset specifications when equipment type changes (same as quick-add does)

## Files
- `apps/client/src/components/equipment-spec-fields.tsx` (new)
- `apps/client/src/components/equipment-manager.tsx` (import change)
- `apps/client/src/pages/equipment.tsx` (use new component)
