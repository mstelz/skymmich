# Astrorep - Astrophotography Management System

A comprehensive system for managing astrophotography images with automatic plate-solving capabilities.

## Features

- **Image Management**: Sync and organize astrophotography images from Immich
- **Plate Solving**: Automatic plate-solving integration with Astrometry.net
- **Equipment Tracking**: Manage telescopes, cameras, and other equipment
- **Advanced Filtering**: Filter by object type, tags, and plate-solving status
- **Real-time Updates**: Live status updates for plate-solving jobs

## Plate Solving Worker

The system includes a dedicated worker process that automatically monitors and updates plate-solving job status.

### Running the Worker

#### Development
```bash
# Run both API server and worker together
npm run dev:all

# Or run them separately
npm run dev          # API server only
npm run dev:worker   # Worker only
```

#### Production
```bash
# Build the application
npm run build

# Run API server
npm run start

# Run worker (in a separate terminal/process)
npm run start:worker
```

### Worker Features

- **Automatic Job Monitoring**: Checks processing jobs every 30 seconds
- **Status Updates**: Updates job status (success/failed) and image metadata
- **Error Handling**: Graceful error handling with retry logic
- **Logging**: Comprehensive logging for debugging and monitoring
- **Graceful Shutdown**: Handles SIGINT and SIGTERM signals properly

### Job Status Flow

1. **Job Submission**: User clicks "Solve" on an image
2. **Worker Monitoring**: Worker checks processing jobs every 30 seconds
3. **Status Update**: When Astrometry.net completes, worker updates job status
4. **Image Update**: Worker updates the original image with plate-solving results
5. **UI Refresh**: Frontend automatically reflects the changes

## Environment Variables

Required environment variables:

```bash
# Astrometry.net API key
ASTROMETRY_API_KEY=your_astrometry_api_key

# Immich configuration
IMMICH_URL=https://your-immich-instance.com
IMMICH_API_KEY=your_immich_api_key
IMMICH_ALBUM_IDS=album_id1,album_id2
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev:all

# Build for production
npm run build
```

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Worker**: Dedicated Node.js process for background tasks
- **Plate Solving**: Astrometry.net integration
- **Image Storage**: Immich integration 