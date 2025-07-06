# Plate Solving Feature

## Overview

The plate solving feature allows users to manually submit 1 to many images for plate solving using Astrometry.net. This provides a dedicated interface for bulk plate solving operations.

## Features

### Plate Solving Page (`/plate-solving`)

- **Image Selection**: Browse and select multiple images for plate solving
- **Search & Filter**: Search by image title and filter by plate solving status
- **Bulk Operations**: Submit multiple images simultaneously for plate solving
- **Real-time Status**: View current plate solving job status and progress
- **Statistics Dashboard**: See overview of all plate solving jobs

### Key Components

1. **Plate Solving Page** (`client/src/pages/plate-solving.tsx`)
   - Main interface for bulk plate solving
   - Image grid with selection capabilities
   - Search and filtering options
   - Bulk submission functionality

2. **Bulk API Endpoint** (`/api/plate-solving/bulk`)
   - Accepts array of image IDs
   - Submits each image for plate solving
   - Returns detailed results for each submission

3. **Navigation Integration**
   - Added "Plate Solving" link in header navigation
   - Repurposed "Submit New Image" button in Astrometry.net status card (sidebar)

## Usage

### Accessing the Plate Solving Page

1. **Via Navigation**: Click "Plate Solving" in the header navigation
2. **Via Sidebar**: Click "Submit New Image" in the Astrometry.net Status card
3. **Direct URL**: Navigate to `/plate-solving`

### Submitting Images for Plate Solving

1. **Browse Images**: The page shows all images with their current plate solving status
2. **Filter Options**:
   - Search by image title
   - Toggle "Show only unsolved images" to focus on images that need plate solving
3. **Select Images**:
   - Click individual images to select/deselect them
   - Use "Select All" / "Deselect All" buttons for bulk selection
4. **Submit**: Click "Submit X for Plate Solving" to start the process

### Understanding Status

- **Plate Solved**: Images that have already been successfully plate solved
- **Pending**: Jobs submitted but not yet processed
- **Processing**: Jobs currently being processed by Astrometry.net
- **Completed**: Successfully completed plate solving jobs
- **Failed**: Jobs that failed during processing

## API Endpoints

### Bulk Plate Solving
```
POST /api/plate-solving/bulk
Content-Type: application/json

{
  "imageIds": [1, 2, 3, 4]
}
```

Response:
```json
{
  "message": "Bulk plate solving submission completed",
  "results": [
    {
      "imageId": 1,
      "success": true,
      "submissionId": "12345",
      "jobId": 1,
      "message": "Submitted for plate solving"
    },
    {
      "imageId": 2,
      "success": false,
      "error": "Image already plate solved"
    }
  ]
}
```

### Individual Plate Solving
```
POST /api/images/:id/plate-solve
```

### Plate Solving Jobs Status
```
GET /api/plate-solving/jobs
```

## Technical Implementation

### Frontend
- React with TypeScript
- TanStack Query for data fetching
- Real-time updates via Socket.io
- Responsive design with mobile support

### Backend
- Express.js API endpoints
- Integration with existing Astrometry.net service
- Job tracking and status management
- Real-time notifications via Socket.io

### Data Flow
1. User selects images on the plate solving page
2. Frontend calls bulk API endpoint with selected image IDs
3. Backend validates images and submits each to Astrometry.net
4. Jobs are tracked in the database with status updates
5. Real-time updates are sent to the frontend via Socket.io
6. User can monitor progress and see completion status

## Configuration

The plate solving feature requires:
- Astrometry.net API key configured in admin settings
- Immich integration for image access
- Plate solving enabled in admin settings

## Error Handling

- Invalid image IDs are reported individually
- Already plate-solved images are skipped with appropriate messages
- Network errors are handled gracefully
- User receives detailed feedback on submission results

## Future Enhancements

- Batch size limits and progress indicators
- Retry mechanisms for failed jobs
- Advanced filtering options
- Export plate solving results
- Integration with image annotation viewing 