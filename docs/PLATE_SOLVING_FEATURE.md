# Plate Solving Feature

## Overview

The plate solving feature allows users to manually submit 1 to many images for plate solving using Astrometry.net. This provides a dedicated interface for bulk plate solving operations.

## Configuration

### Admin Settings

The plate solving feature can be configured through the admin interface with the following options:

#### Basic Configuration
- **Enable plate solving**: Toggle to enable/disable the entire plate solving system
- **API Key**: Your Astrometry.net API key from nova.astrometry.net

#### Advanced Configuration
- **Worker Check Interval** (seconds): How often the worker checks for new jobs and updates existing ones (default: 30s, range: 10-300s)
- **Active Polling Interval** (seconds): How often to poll when actively waiting for job completion (default: 5s, range: 1-60s)
- **Max Concurrent Jobs**: Maximum number of plate solving jobs to run simultaneously (default: 3, range: 1-10)
- **Auto-resubmit failed jobs**: When enabled, failed jobs will be automatically retried. When disabled, failed jobs must be manually resubmitted (default: disabled)

### Docker Environment Variables

When running in Docker, you can configure plate solving using environment variables:

```bash
# Basic configuration
ASTROMETRY_API_KEY=your_api_key_here
ENABLE_PLATE_SOLVING=true

# Advanced configuration
ASTROMETRY_CHECK_INTERVAL=30
ASTROMETRY_POLL_INTERVAL=5
ASTROMETRY_MAX_CONCURRENT=3
ASTROMETRY_AUTO_RESUBMIT=false
```

### Configuration Priority

1. **Admin Settings** (highest priority) - Settings configured through the web interface
2. **Environment Variables** (fallback) - Docker/container environment variables
3. **Default Values** (lowest priority) - Hardcoded defaults

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

### Failed Job Handling

- **Auto-resubmit disabled** (default): Failed jobs remain in the database with "failed" status and must be manually resubmitted
- **Auto-resubmit enabled**: Failed jobs are automatically retried by the worker process

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
- Configurable worker behavior

### Data Flow
1. User selects images on the plate solving page
2. Frontend calls bulk API endpoint with selected image IDs
3. Backend validates images and submits each to Astrometry.net
4. Jobs are tracked in the database with status updates
5. Real-time updates are sent to the frontend via Socket.io
6. User can monitor progress and see completion status

### Worker Process

The plate solving worker runs continuously and:

1. **Checks for new jobs** every `checkInterval` seconds
2. **Submits unsolved images** automatically when slots are available
3. **Monitors processing jobs** and updates their status
4. **Handles failed jobs** according to the auto-resubmit setting
5. **Respects max concurrent limits** to avoid overwhelming Astrometry.net

### Configuration Requirements

The plate solving feature requires:
- Astrometry.net API key configured in admin settings
- Immich integration for image access
- Plate solving enabled in admin settings

## Error Handling

- Invalid image IDs are reported individually
- Already plate-solved images are skipped with appropriate messages
- Network errors are handled gracefully
- User receives detailed feedback on submission results
- Failed jobs are handled according to auto-resubmit configuration

## Performance Considerations

- **Check Interval**: Lower values provide faster response but increase server load
- **Poll Interval**: Lower values provide faster completion detection but increase API calls to Astrometry.net
- **Max Concurrent**: Should be balanced between throughput and Astrometry.net rate limits
- **Auto-resubmit**: Can help with transient failures but may mask persistent issues

## Future Enhancements

- Batch size limits and progress indicators
- Advanced retry mechanisms with exponential backoff
- Advanced filtering options
- Export plate solving results
- Integration with image annotation viewing
- Custom plate solving service support

## Summary

I've implemented comprehensive configuration options for the plate solving feature that address your requirements:

### Key Changes Made:

1. **Extended AdminSettings Interface**: Added configurable parameters for plate solving behavior
2. **Enhanced Admin UI**: Added form controls for all plate solving configuration options with helpful descriptions
3. **Updated Config Service**: Added support for environment variables and admin settings with proper fallback logic
4. **Modified Worker**: Now uses configurable values and respects the auto-resubmit setting
5. **Updated Astrometry Service**: Uses configurable polling intervals and max wait times
6. **Enhanced Docker Configuration**: Added all new environment variables with sensible defaults
7. **Updated Documentation**: Comprehensive guide covering all configuration options

### Configuration Options:

- **Worker Check Interval**: How often the worker checks for jobs (10-300 seconds)
- **Active Polling Interval**: How often to poll when waiting for completion (1-60 seconds)  
- **Max Concurrent Jobs**: Maximum simultaneous jobs (1-10)
- **Auto-resubmit**: Whether to automatically retry failed jobs (default: disabled)

### Behavior Changes:

- **No Auto-resubmission**: By default, failed jobs are not automatically retried - users must manually resubmit
- **No Timeout**: The system now polls continuously until Astrometry.net explicitly marks a job as failed or successful
- **Flexible Polling**: Both worker check interval and active polling interval are configurable
- **Environment Variable Support**: All settings can be configured via Docker environment variables

The system now provides much more flexibility while maintaining the requirement that failed jobs should not be auto-resubmitted unless explicitly configured to do so. 