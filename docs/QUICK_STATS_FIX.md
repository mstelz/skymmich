# Quick Stats Fix

## Problem
Quick stats on the gallery page are not displaying correctly.

## Root Cause
Field name mismatch between backend and frontend:

| Backend returns | Frontend expects |
|----------------|-----------------|
| `totalImages` | `totalImages` |
| `plateSolvedImages` | `plateSolved` |
| `totalIntegrationHours` | `totalHours` |
| *(not computed)* | `uniqueTargets` |

The frontend Stats type expects `{ totalImages, plateSolved, totalHours, uniqueTargets }` but the backend `getStats()` returns different field names and doesn't compute `uniqueTargets` at all.

## Solution
Fix the backend `getStats()` method to return fields matching what the frontend expects.

### Backend (`apps/server/src/services/storage.ts`)
In the `getStats()` method's return object, add:
- `plateSolved`: alias for `plateSolvedImages`
- `totalHours`: alias for `totalIntegrationHours`
- `uniqueTargets`: count of distinct image titles/object names

Keep the existing fields for backward compatibility with any other consumers.

## Files
- `apps/server/src/services/storage.ts` — `getStats()` method
