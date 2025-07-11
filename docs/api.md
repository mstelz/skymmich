# Skymmich API Documentation

This document describes the REST API endpoints available in Skymmich.

## Base URL

All API endpoints are relative to your Skymmich server's base URL:
```
http://localhost:5000/api
```

## Authentication

Currently, Skymmich does not require authentication for API access. All endpoints are publicly accessible when the server is running.

## Response Format

All API responses return JSON with the following general structure:

**Success Response:**
```json
{
  "data": {...},
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "message": "Error description",
  "error": "Additional error details"
}
```

## Endpoints

### 🖼️ Images

#### Get All Images
```
GET /api/images
```

**Query Parameters:**
- `objectType` (string) - Filter by object type
- `tags` (string|array) - Filter by tags
- `plateSolved` (boolean) - Filter by plate solving status
- `constellation` (string) - Filter by constellation

**Response:**
```json
[
  {
    "id": 1,
    "immichId": "uuid",
    "title": "M31 Andromeda Galaxy",
    "filename": "m31.jpg",
    "thumbnailUrl": "/api/assets/uuid/thumbnail",
    "fullUrl": "/api/assets/uuid/thumbnail?size=preview",
    "captureDate": "2023-10-15T22:30:00Z",
    "focalLength": 600,
    "aperture": "f/5.6",
    "iso": 1600,
    "exposureTime": "300s",
    "plateSolved": true,
    "ra": "0.712",
    "dec": "41.269",
    "constellation": "Andromeda",
    "tags": ["galaxy", "deep-sky"],
    "objectType": "Galaxy"
  }
]
```

#### Get Single Image
```
GET /api/images/{id}
```

**Parameters:**
- `id` (integer) - Image ID

**Response:** Single image object (same structure as above)

#### Update Image
```
PATCH /api/images/{id}
```

**Parameters:**
- `id` (integer) - Image ID

**Request Body:**
```json
{
  "title": "Updated title",
  "objectType": "Galaxy",
  "tags": ["galaxy", "messier"],
  "description": "Updated description"
}
```

**Response:** Updated image object

### 🔭 Plate Solving

#### Submit Image for Plate Solving
```
POST /api/images/{id}/plate-solve
```

**Parameters:**
- `id` (integer) - Image ID

**Response:**
```json
{
  "message": "Image plate solving completed successfully",
  "result": {
    "calibration": {
      "ra": 10.684,
      "dec": 41.269,
      "pixscale": 2.77,
      "radius": 0.5,
      "orientation": 90.0,
      "parity": 1
    },
    "annotations": [
      {
        "type": "star",
        "names": ["HD 12345"],
        "ra": 10.684,
        "dec": 41.269,
        "pixelx": 1024,
        "pixely": 768,
        "radius": 10
      }
    ],
    "machineTags": ["galaxy", "andromeda", "messier"]
  }
}
```

#### Get Plate Solving Jobs
```
GET /api/plate-solving/jobs
```

**Response:**
```json
[
  {
    "id": 1,
    "imageId": 1,
    "astrometrySubmissionId": "12345",
    "astrometryJobId": "67890",
    "status": "success",
    "submittedAt": "2023-10-15T22:30:00Z",
    "completedAt": "2023-10-15T22:35:00Z",
    "result": {
      "ra": 10.684,
      "dec": 41.269,
      "pixscale": 2.77
    }
  }
]
```

#### Bulk Submit for Plate Solving
```
POST /api/plate-solving/bulk
```

**Request Body:**
```json
{
  "imageIds": [1, 2, 3, 4, 5]
}
```

**Response:**
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

#### Get Image Annotations
```
GET /api/images/{id}/annotations
```

**Parameters:**
- `id` (integer) - Image ID

**Response:**
```json
{
  "annotations": [
    {
      "type": "star",
      "names": ["HD 12345"],
      "ra": 10.684,
      "dec": 41.269,
      "pixelx": 1024,
      "pixely": 768,
      "radius": 10
    }
  ],
  "calibration": {
    "ra": 10.684,
    "dec": 41.269,
    "pixscale": 2.77,
    "radius": 0.5,
    "orientation": 90.0
  },
  "imageDimensions": {
    "width": 2048,
    "height": 1536
  }
}
```

### 🛠️ Equipment

#### Get All Equipment
```
GET /api/equipment
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Celestron EdgeHD 11",
    "type": "telescope",
    "specifications": {
      "aperture": "279mm",
      "focalLength": "2800mm",
      "focalRatio": "f/10"
    },
    "description": "Schmidt-Cassegrain telescope",
    "createdAt": "2023-10-15T22:30:00Z",
    "updatedAt": "2023-10-15T22:30:00Z"
  }
]
```

#### Create Equipment
```
POST /api/equipment
```

**Request Body:**
```json
{
  "name": "Canon EOS R5",
  "type": "camera",
  "specifications": {
    "sensor": "Full Frame",
    "resolution": "45MP",
    "pixelSize": "4.39μm"
  },
  "description": "Mirrorless camera for astrophotography"
}
```

**Response:** Created equipment object

#### Update Equipment
```
PUT /api/equipment/{id}
```

**Parameters:**
- `id` (integer) - Equipment ID

**Request Body:** Same as create equipment

**Response:** Updated equipment object

#### Delete Equipment
```
DELETE /api/equipment/{id}
```

**Parameters:**
- `id` (integer) - Equipment ID

**Response:**
```json
{
  "message": "Equipment deleted successfully"
}
```

#### Get Equipment for Image
```
GET /api/images/{id}/equipment
```

**Parameters:**
- `id` (integer) - Image ID

**Response:**
```json
[
  {
    "id": 1,
    "name": "Celestron EdgeHD 11",
    "type": "telescope",
    "specifications": {...},
    "settings": {
      "focalLength": 2800,
      "focalRatio": "f/10"
    },
    "notes": "Used with field flattener"
  }
]
```

#### Add Equipment to Image
```
POST /api/images/{id}/equipment
```

**Parameters:**
- `id` (integer) - Image ID

**Request Body:**
```json
{
  "equipmentId": 1,
  "settings": {
    "focalLength": 2800,
    "focalRatio": "f/10"
  },
  "notes": "Used with field flattener"
}
```

**Response:** Image-equipment relationship object

#### Remove Equipment from Image
```
DELETE /api/images/{imageId}/equipment/{equipmentId}
```

**Parameters:**
- `imageId` (integer) - Image ID
- `equipmentId` (integer) - Equipment ID

**Response:**
```json
{
  "message": "Equipment removed from image"
}
```

### ⚙️ Admin & Configuration

#### Get Admin Settings
```
GET /api/admin/settings
```

**Response:**
```json
{
  "immich": {
    "host": "http://localhost:2283",
    "apiKey": "your-api-key",
    "autoSync": true,
    "syncFrequency": "0 */4 * * *",
    "syncByAlbum": true,
    "selectedAlbumIds": ["uuid1", "uuid2"]
  },
  "astrometry": {
    "apiKey": "your-api-key",
    "enabled": true,
    "checkInterval": 30,
    "pollInterval": 5,
    "maxConcurrent": 3,
    "autoResubmit": false
  },
  "app": {
    "debugMode": false
  }
}
```

#### Update Admin Settings
```
POST /api/admin/settings
```

**Request Body:** Same structure as GET response

**Response:**
```json
{
  "success": true,
  "message": "Settings saved successfully"
}
```

#### Test Immich Connection
```
POST /api/test-immich-connection
```

**Request Body:**
```json
{
  "host": "http://localhost:2283",
  "apiKey": "your-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful!"
}
```

#### Test Astrometry Connection
```
POST /api/test-astrometry-connection
```

**Request Body:**
```json
{
  "apiKey": "your-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful!"
}
```

### 🔄 Sync & Integration

#### Sync Images from Immich
```
POST /api/sync-immich
```

**Response:**
```json
{
  "message": "Successfully synced 25 new images from Immich. Removed 2 images no longer in Immich.",
  "syncedCount": 25,
  "removedCount": 2
}
```

#### Get Immich Albums
```
POST /api/immich/albums
```

**Request Body:**
```json
{
  "host": "http://localhost:2283",
  "apiKey": "your-api-key"
}
```

**Response:**
```json
[
  {
    "id": "uuid1",
    "albumName": "Astrophotography"
  },
  {
    "id": "uuid2",
    "albumName": "Deep Sky Objects"
  }
]
```

### 📊 Statistics & Data

#### Get Statistics
```
GET /api/stats
```

**Response:**
```json
{
  "totalImages": 150,
  "plateSolvedImages": 120,
  "totalEquipment": 15,
  "totalIntegrationHours": 45.7,
  "objectTypeCounts": {
    "Galaxy": 45,
    "Nebula": 38,
    "Star Cluster": 25,
    "Planet": 12
  },
  "plateSolvingStats": {
    "total": 125,
    "pending": 5,
    "successful": 120,
    "failed": 0
  }
}
```

#### Get Tags
```
GET /api/tags
```

**Response:**
```json
[
  {
    "tag": "galaxy",
    "count": 45
  },
  {
    "tag": "nebula",
    "count": 38
  },
  {
    "tag": "messier",
    "count": 25
  }
]
```

#### Get Constellations
```
GET /api/constellations
```

**Response:**
```json
[
  "Andromeda",
  "Cassiopeia",
  "Cygnus",
  "Orion",
  "Ursa Major"
]
```

### 🔔 Notifications

#### Get Notifications
```
GET /api/notifications
```

**Response:**
```json
[
  {
    "id": 1,
    "type": "info",
    "title": "Plate Solving Complete",
    "message": "Successfully plate solved 5 images",
    "details": {
      "imageCount": 5,
      "duration": "2 minutes"
    },
    "acknowledged": false,
    "createdAt": "2023-10-15T22:30:00Z"
  }
]
```

#### Acknowledge Notification
```
POST /api/notifications/{id}/acknowledge
```

**Parameters:**
- `id` (integer) - Notification ID

**Response:**
```json
{
  "success": true,
  "message": "Notification acknowledged"
}
```

### 🏥 Health & Monitoring

#### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-10-15T22:30:00Z",
  "uptime": 86400,
  "database": "healthy",
  "worker": {
    "enabled": true,
    "running": true,
    "pid": 1234,
    "restartAttempts": 0
  },
  "version": "1.2.0",
  "nodeVersion": "v20.10.0"
}
```

### 🎯 Asset Proxy

#### Get Asset
```
GET /api/assets/{assetId}/{type}
```

**Parameters:**
- `assetId` (string) - Immich asset ID
- `type` (string) - Asset type (`thumbnail`, `original`, etc.)

**Query Parameters:**
- `size` (string) - Size parameter (e.g., `preview`)

**Response:** Binary image data

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

All error responses include a descriptive message:

```json
{
  "message": "Image not found",
  "error": "Additional error details"
}
```

## Rate Limiting

Currently, there are no rate limits implemented. However, be mindful of:
- Bulk operations (like plate solving) can be resource-intensive
- Image proxy requests are forwarded to Immich
- Astrometry.net API calls are subject to their rate limits

## WebSocket Events

Skymmich uses Socket.IO for real-time updates. Connect to the main server URL and listen for these events:

### Plate Solving Updates
```javascript
socket.on('plate-solving-update', (data) => {
  console.log('Plate solving update:', data);
  // data: { jobId, status, result, imageId, message }
});
```

## SDK Usage

For TypeScript/JavaScript applications, you can use the API with axios or fetch:

```javascript
// Get all images
const response = await fetch('/api/images');
const images = await response.json();

// Submit for plate solving
const result = await fetch(`/api/images/${imageId}/plate-solve`, {
  method: 'POST'
});
const plateSolveResult = await result.json();
```

## Environment Variables

Some API behavior can be configured via environment variables:

- `ASTROMETRY_API_KEY` - Default Astrometry.net API key
- `IMMICH_URL` - Default Immich server URL
- `IMMICH_API_KEY` - Default Immich API key
- `ENABLE_PLATE_SOLVING` - Enable/disable plate solving worker

Note: Admin settings take precedence over environment variables.

## Best Practices

1. **Use filtering** - Always filter API responses when possible to reduce payload size
2. **Handle errors** - Implement proper error handling for all API calls
3. **Check health** - Monitor the `/api/health` endpoint for system status
4. **Batch operations** - Use bulk endpoints when processing multiple items
5. **Real-time updates** - Use WebSocket connections for live updates
6. **Asset caching** - Cache image assets appropriately to reduce load

## Support

For API support and questions:
- Check the [GitHub Issues](https://github.com/mstelz/Skymmich/issues)
- Review the [Contributing Guide](../CONTRIBUTING.md)
- Join discussions in [GitHub Discussions](https://github.com/mstelz/Skymmich/discussions)