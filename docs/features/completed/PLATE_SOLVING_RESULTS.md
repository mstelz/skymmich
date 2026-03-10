# Plate Solving Results & Error Display

## Problem
When plate solving succeeds or fails, the user cannot see the details — only a status badge is shown. Error messages and calibration results are stored in the database but never surfaced in the UI.

## Current State
- Plate solving results stored in `plate_solving_jobs.result` JSON column
- On success: `{ ra, dec, pixscale, radius, orientation, annotations: [...] }`
- On failure: `{ error: "Job failed on Astrometry.net" }` or similar
- UI (`plate-solving.tsx`) only shows status badges (pending/processing/success/failed)
- Image overlay shows plate solved status but no details

## Solution
Surface plate solving result details in both the plate solving page and the image overlay.

### Plate Solving Page (`apps/client/src/pages/plate-solving.tsx`)
- Add expandable detail section per job row
- On success: show RA, Dec, pixel scale, field radius, orientation
- On failure: show the error message from `result.error`
- Show submission/completion timestamps

### Image Overlay (`apps/client/src/components/image-overlay.tsx`)
- In the plate solving status section, add expandable details
- Success: compact display of calibration data (RA/Dec, pixel scale, orientation)
- Failure: show error message with option to retry

## Files
- `apps/client/src/pages/plate-solving.tsx`
- `apps/client/src/components/image-overlay.tsx`
