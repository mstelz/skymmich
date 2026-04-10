# Skymmich Architecture

**Version:** 0.9.2
**Last Updated:** 2026-04-10

---

## Table of Contents

- [System Overview](#system-overview)
- [Monorepo Structure](#monorepo-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Layer](#data-layer)
- [Real-Time Communication](#real-time-communication)
- [External Integrations](#external-integrations)
- [Background Processing](#background-processing)
- [Deployment & Infrastructure](#deployment--infrastructure)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security Considerations](#security-considerations)

---

## System Overview

Skymmich is a full-stack astrophotography management platform built with TypeScript. It integrates with Immich (self-hosted photo library) and Astrometry.net (plate solving service) to enrich astrophotography images with astronomy-specific metadata, equipment tracking, target planning, and sky mapping.

```mermaid
graph TB
    subgraph User["User"]
        Browser["Browser (SPA)"]
    end

    subgraph Skymmich["Skymmich Application"]
        subgraph Frontend["Frontend (React + Vite)"]
            Pages["Pages"]
            Components["UI Components"]
            QueryClient["TanStack Query"]
            WSClient["WebSocket Client"]
        end

        subgraph Backend["Backend (Hono)"]
            API["REST API Routes"]
            Services["Service Layer"]
            WSServer["WebSocket Server"]
            CronMgr["Cron Manager"]
        end

        subgraph Worker["Worker Process"]
            PlateSolver["Plate Solve Queue"]
        end
    end

    subgraph DataStores["Data Stores"]
        SQLite["SQLite"]
        PostgreSQL["PostgreSQL"]
    end

    subgraph External["External Services"]
        Immich["Immich Server"]
        Astrometry["Astrometry.net"]
    end

    Browser -->|HTTP| API
    Browser <-->|WebSocket| WSServer
    API --> Services
    Services --> SQLite
    Services --> PostgreSQL
    Services -->|Sync Albums| Immich
    Worker -->|Submit Jobs| Astrometry
    Worker <-->|Status Updates| WSServer
    CronMgr -->|Scheduled Sync| Services
    Worker --> SQLite
    Worker --> PostgreSQL

    style Frontend fill:#2563eb,color:#fff
    style Backend fill:#059669,color:#fff
    style Worker fill:#d97706,color:#fff
    style DataStores fill:#7c3aed,color:#fff
    style External fill:#dc2626,color:#fff
```

---

## Monorepo Structure

The project is organized as a monorepo with clear separation between frontend, backend, and shared packages.

```mermaid
graph LR
    subgraph Root["skymmich/"]
        subgraph Apps["apps/"]
            Client["client/<br/>React SPA"]
            Server["server/<br/>Hono API + Worker"]
        end

        subgraph Packages["packages/"]
            Shared["shared/<br/>Types, Schemas, Utilities"]
        end

        subgraph Tools["tools/"]
            Migrations["migrations/<br/>Drizzle Migrations"]
            Scripts["scripts/<br/>Build & Seed Scripts"]
        end

        subgraph Docker["docker/"]
            Startup["startup.sh"]
            Templates["Unraid Templates"]
        end

        subgraph CI[".github/workflows/"]
            BuildPush["docker-build-push.yml"]
            Release["release.yml"]
            Prune["prune-ghcr.yml"]
        end
    end

    Client -->|imports| Shared
    Server -->|imports| Shared

    style Client fill:#2563eb,color:#fff
    style Server fill:#059669,color:#fff
    style Shared fill:#7c3aed,color:#fff
    style Migrations fill:#6b7280,color:#fff
    style Scripts fill:#6b7280,color:#fff
```

### Key Directories

| Path | Purpose |
|------|---------|
| `apps/client/` | React SPA — pages, components, hooks, API clients |
| `apps/server/` | Hono HTTP server — routes, services, workers |
| `packages/shared/` | Drizzle schemas (dual PG/SQLite), Zod validation, shared types & utilities |
| `tools/migrations/` | Drizzle-managed database migrations |
| `tools/scripts/` | Build helpers, database seeding |
| `docker/` | Container startup script, platform templates |

---

## Frontend Architecture

The frontend is a React 19 single-page application built with Vite, using a component-driven architecture with server state management via TanStack Query.

```mermaid
graph TB
    subgraph SPA["React SPA"]
        Router["Wouter Router"]

        subgraph Pages["Pages"]
            Home["Home<br/>Gallery + Stats"]
            PlateSolving["Plate Solving<br/>Job Monitor"]
            SkyMap["Sky Map<br/>Interactive Atlas"]
            Targets["Targets<br/>Observation Planner"]
            Equipment["Equipment<br/>Gear Catalog"]
            Locations["Locations<br/>Site Manager"]
            Admin["Admin<br/>Settings"]
        end

        subgraph StateLayer["State & Data"]
            TQ["TanStack Query<br/>Server State Cache"]
            RHF["React Hook Form<br/>Form State"]
            Zod["Zod<br/>Validation"]
        end

        subgraph UILayer["UI Layer"]
            ShadCN["shadcn/ui + Radix"]
            Tailwind["Tailwind CSS"]
            Framer["Framer Motion"]
            Recharts["Recharts"]
        end

        subgraph Specialized["Specialized Viewers"]
            OSD["OpenSeadragon<br/>Deep Zoom"]
            Leaflet["Leaflet<br/>Maps"]
            Aladin["Aladin Lite<br/>Sky Atlas"]
        end
    end

    subgraph Transport["Data Transport"]
        FetchAPI["fetch() + apiRequest()"]
        WSHook["useSocket Hook"]
    end

    Router --> Pages
    Pages --> StateLayer
    Pages --> UILayer
    Pages --> Specialized
    TQ --> FetchAPI
    WSHook -->|Real-time Updates| TQ

    style SPA fill:#1e1e2e,color:#cdd6f4
    style Pages fill:#2563eb,color:#fff
    style StateLayer fill:#059669,color:#fff
    style UILayer fill:#7c3aed,color:#fff
    style Specialized fill:#d97706,color:#fff
    style Transport fill:#dc2626,color:#fff
```

### Data Flow Pattern

```mermaid
sequenceDiagram
    participant UI as React Component
    participant RQ as TanStack Query
    participant API as apiRequest()
    participant WS as WebSocket

    UI->>RQ: useQuery({ queryKey, queryFn })
    RQ->>API: GET /api/resource
    API-->>RQ: JSON Response
    RQ-->>UI: Cached Data

    Note over UI,WS: Real-time updates
    WS-->>RQ: Event received
    RQ->>RQ: Invalidate query
    RQ->>API: Refetch
    API-->>RQ: Updated data
    RQ-->>UI: Re-render
```

### Key Frontend Technologies

| Library | Role |
|---------|------|
| React 19 + Vite 8 | Core framework and build tool |
| Wouter | Lightweight client-side routing |
| TanStack Query | Server state caching, deduplication, background refetch |
| React Hook Form + Zod | Form state management with schema validation |
| shadcn/ui + Radix | Accessible, composable UI primitives |
| Tailwind CSS | Utility-first styling |
| OpenSeadragon | Deep zoom for high-resolution astro images |
| Leaflet | Interactive maps for observation locations |
| Aladin Lite | Embedded sky atlas for celestial visualization |
| Recharts | Data visualization and statistics charts |

---

## Backend Architecture

The backend is a Hono HTTP server running on Node.js. It follows a layered architecture: routes handle HTTP concerns, services encapsulate business logic, and a shared storage layer abstracts the database.

```mermaid
graph TB
    subgraph HTTP["HTTP Layer"]
        Hono["Hono Server<br/>Port 5000"]
        CORS["CORS Middleware"]
        Static["Static File Serving<br/>SPA Fallback"]
    end

    subgraph Routes["Route Layer"]
        ImagesR["/api/images"]
        EquipR["/api/equipment"]
        CatalogR["/api/catalog"]
        PlateR["/api/plate-solving"]
        ImmichR["/api/immich"]
        SystemR["/api/system"]
        TargetsR["/api/targets"]
        LocationsR["/api/locations"]
        SkyMapR["/api/sky-map"]
    end

    subgraph ServiceLayer["Service Layer"]
        Storage["DbStorage<br/>All DB Operations"]
        AstroSvc["AstrometryService<br/>Plate Solving"]
        ImmichSvc["ImmichSyncService<br/>Photo Library Sync"]
        CatalogSvc["CatalogService<br/>OpenNGC Catalog"]
        ConfigSvc["ConfigService<br/>Settings Management"]
        XMPSvc["XMP Sidecar Service<br/>Metadata Files"]
        ConstellationSvc["Constellation Utils<br/>RA/Dec Mapping"]
    end

    subgraph Data["Data Layer"]
        Drizzle["Drizzle ORM"]
        SQLite["SQLite Driver"]
        PGDriver["PostgreSQL Driver"]
    end

    Hono --> CORS --> Routes
    Hono --> Static
    Routes --> ServiceLayer
    ServiceLayer --> Storage
    Storage --> Drizzle
    Drizzle --> SQLite
    Drizzle --> PGDriver

    style HTTP fill:#059669,color:#fff
    style Routes fill:#2563eb,color:#fff
    style ServiceLayer fill:#d97706,color:#fff
    style Data fill:#7c3aed,color:#fff
```

### API Route Summary

| Route | Purpose |
|-------|---------|
| `GET/PATCH /api/images` | Image listing with filters, metadata updates |
| `POST /api/plate-solving/images/:id/plate-solve` | Submit image for plate solving |
| `GET/POST /api/immich/sync` | Immich album sync and connection testing |
| `CRUD /api/equipment` | Equipment catalog management |
| `CRUD /api/equipment-groups` | Equipment grouping by type |
| `GET /api/catalog` | OpenNGC deep-sky object search |
| `CRUD /api/targets` | Observation target planning |
| `CRUD /api/locations` | Observation site management |
| `GET /api/sky-map` | Sky map data (constellation boundaries) |
| `GET/POST /api/system/settings` | Admin configuration, health checks |

### Service Responsibilities

| Service | Responsibility |
|---------|---------------|
| **DbStorage** | All database CRUD — images, equipment, jobs, settings, notifications |
| **ConfigService** | Three-tier config resolution: env vars > DB settings > defaults |
| **AstrometryService** | Astrometry.net API integration, job lifecycle, result parsing |
| **ImmichSyncService** | Album fetching, photo matching, metadata sync back to Immich |
| **CatalogService** | OpenNGC catalog lazy loading, search, and caching |
| **XMP Sidecar** | Generate EXIF/XMP metadata files alongside images |
| **WsManager** | WebSocket connection management and broadcasting |
| **CronManager** | Scheduled job orchestration |

---

## Data Layer

Skymmich supports dual databases via Drizzle ORM with synchronized schemas — SQLite for simplicity and PostgreSQL for scale.

```mermaid
erDiagram
    astrophotographyImages {
        int id PK
        string immichId UK
        string filename
        string thumbnailUrl
        string fullUrl
        datetime captureDate
        float focalLength
        float aperture
        int iso
        float exposureTime
        float ra
        float dec
        float pixelScale
        float fov
        float rotation
        string constellation
        string objectType
        text description
        json tags
    }

    equipment {
        int id PK
        string name
        string type
        string brand
        string model
        json specifications
    }

    imageEquipment {
        int id PK
        int imageId FK
        int equipmentId FK
        text settings
        text notes
    }

    plateSolvingJobs {
        int id PK
        int imageId FK
        string status
        string astrometryJobId
        json result
        datetime submittedAt
        datetime completedAt
    }

    imageAcquisition {
        int id PK
        int imageId FK
        string filterType
        int frameCount
        float exposureTime
        int gain
        int offset
    }

    equipmentGroups {
        int id PK
        string name
        text description
    }

    equipmentGroupMember {
        int groupId FK
        int equipmentId FK
    }

    locations {
        int id PK
        string name
        float latitude
        float longitude
        float altitude
        int bortleClass
    }

    userTargets {
        int id PK
        string name
        string objectType
        float ra
        float dec
        string constellation
        int priority
    }

    catalogObjects {
        int id PK
        string name
        string type
        string constellation
        float ra
        float dec
        float magnitude
    }

    adminSettings {
        int id PK
        string key UK
        json value
    }

    notifications {
        int id PK
        string type
        string message
        datetime createdAt
    }

    astrophotographyImages ||--o{ imageEquipment : "has"
    equipment ||--o{ imageEquipment : "used in"
    astrophotographyImages ||--o{ plateSolvingJobs : "solved by"
    astrophotographyImages ||--o{ imageAcquisition : "captured with"
    equipmentGroups ||--o{ equipmentGroupMember : "contains"
    equipment ||--o{ equipmentGroupMember : "belongs to"
```

### Dual Database Strategy

```mermaid
graph LR
    subgraph App["Application"]
        Drizzle["Drizzle ORM"]
    end

    subgraph SchemaSync["Synchronized Schemas"]
        PGSchema["pg-schema.ts<br/>(pgTable)"]
        SQLiteSchema["sqlite-schema.ts<br/>(sqliteTable)"]
    end

    subgraph Runtime["Runtime Selection"]
        EnvCheck{"DATABASE_URL<br/>set?"}
        PG["PostgreSQL"]
        SQ["SQLite File"]
    end

    Drizzle --> SchemaSync
    Drizzle --> EnvCheck
    EnvCheck -->|Yes| PG
    EnvCheck -->|No| SQ

    style App fill:#059669,color:#fff
    style SchemaSync fill:#7c3aed,color:#fff
    style PG fill:#336791,color:#fff
    style SQ fill:#003b57,color:#fff
```

- **SQLite** (default): Zero-config, file-based at `/app/config/skymmich.db`. Ideal for single-user or low-traffic setups.
- **PostgreSQL** (optional): Enabled by setting `DATABASE_URL`. Recommended for multi-user or high-volume deployments.
- **Migrations**: Managed by Drizzle Kit. Applied automatically on server startup.

---

## Real-Time Communication

WebSocket connections provide real-time updates for long-running operations like plate solving and Immich sync.

```mermaid
sequenceDiagram
    participant Browser as Browser
    participant Server as Hono Server (WsManager)
    participant Worker as Worker Process

    Browser->>Server: WS Connect /ws
    Server-->>Browser: Connection established

    Note over Worker: Polls for unsolved images
    Worker->>Server: WS Connect /ws
    Worker->>Worker: Submit to Astrometry.net
    Worker->>Server: { event: "plate-solving-update", data: { status: "processing" } }
    Server-->>Browser: Broadcast update

    Worker->>Worker: Poll job status...
    Worker->>Server: { event: "plate-solving-update", data: { status: "success", result: {...} } }
    Server-->>Browser: Broadcast update
    Browser->>Browser: Invalidate queries, re-render

    Note over Server: Cron-triggered Immich sync
    Server->>Server: Sync albums from Immich
    Server-->>Browser: { event: "immich-sync-complete", data: { syncedCount: 42 } }
```

### Event Types

| Event | Source | Payload |
|-------|--------|---------|
| `plate-solving-update` | Worker | `{ jobId, status, result }` |
| `immich-sync-complete` | Cron Manager | `{ success, message, syncedCount, removedCount }` |

### Client Connection Management

- Singleton WebSocket manager with reference counting
- Automatic reconnection with exponential backoff (1s to 30s max)
- Page-level hooks (`usePlateSolvingUpdates`, `useImmichSyncUpdates`) manage subscriptions

---

## External Integrations

```mermaid
graph TB
    subgraph Skymmich["Skymmich"]
        SyncSvc["Immich Sync Service"]
        AstroSvc["Astrometry Service"]
        CatalogSvc["Catalog Service"]
    end

    subgraph Immich["Immich Server"]
        ImmichAPI["REST API"]
        ImmichLib["Photo Library"]
    end

    subgraph AstrometryNet["Astrometry.net"]
        AstroAPI["REST API"]
        Solver["Plate Solver Engine"]
    end

    subgraph GitHub["GitHub"]
        OpenNGC["OpenNGC Catalog<br/>(CSV Release)"]
    end

    SyncSvc -->|"X-API-Key Header"| ImmichAPI
    ImmichAPI --> ImmichLib
    SyncSvc -->|"Sync metadata back"| ImmichAPI

    AstroSvc -->|"Login (API Key)"| AstroAPI
    AstroSvc -->|"Submit Image"| AstroAPI
    AstroAPI --> Solver
    Solver -->|"Calibration Results"| AstroSvc

    CatalogSvc -->|"Fetch CSV"| OpenNGC

    style Skymmich fill:#059669,color:#fff
    style Immich fill:#2563eb,color:#fff
    style AstrometryNet fill:#d97706,color:#fff
    style GitHub fill:#6b7280,color:#fff
```

### Immich Integration

- **Sync Direction**: Bidirectional — pulls images from Immich, pushes enriched metadata back
- **Path Mapping**: Translates Immich internal paths (`/usr/src/app/upload`) to local mount paths (`/immich-upload`)
- **Scheduled Sync**: Runs every 4 hours via cron (configurable)
- **Authentication**: API key passed via `X-API-Key` header

### Astrometry.net Integration

- **Flow**: Login (API key) -> Submit image (URL or file upload) -> Poll job status -> Parse calibration results
- **Results**: RA/Dec coordinates, pixel scale, field of view, rotation angle, constellation, annotations
- **Output**: Results stored in DB, written to XMP sidecar files, synced back to Immich

### OpenNGC Catalog

- Lazily loaded from GitHub releases (CSV format)
- Cached in the database for fast search
- Provides NGC/Messier/IC object details, coordinates, magnitudes

---

## Background Processing

```mermaid
graph TB
    subgraph MainProcess["Main Process (Hono Server)"]
        CronMgr["Cron Manager"]
        WorkerMgr["Worker Manager"]
        ImmichJob["Immich Sync Job<br/>Every 4 hours"]
        CleanupJob["Notification Cleanup<br/>Daily at 2 AM"]
    end

    subgraph WorkerProcess["Worker Process (Separate Node)"]
        Queue["Job Queue"]
        Submitter["Job Submitter"]
        StatusChecker["Status Checker"]
    end

    subgraph External["External"]
        AstroNet["Astrometry.net"]
    end

    CronMgr --> ImmichJob
    CronMgr --> CleanupJob
    WorkerMgr -->|"Spawn & Monitor"| WorkerProcess

    Queue --> Submitter
    Submitter -->|"Submit Image"| AstroNet
    StatusChecker -->|"Poll Status"| AstroNet
    AstroNet -->|"Results"| StatusChecker

    style MainProcess fill:#059669,color:#fff
    style WorkerProcess fill:#d97706,color:#fff
    style External fill:#dc2626,color:#fff
```

### Worker Process

- Runs as a **separate Node.js process** spawned by `WorkerManager`
- Queries the database for unsolved images on a polling interval
- Submits to Astrometry.net with configurable concurrency (default: 3 concurrent jobs)
- Reports progress via WebSocket connection to the main server
- Auto-restarts on crash (exponential backoff, max 5 attempts)
- Can run in **standalone mode** using environment variables only (no DB config)

### Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Immich Sync | `0 */4 * * *` (every 4h) | Pull new images, sync metadata back |
| Notification Cleanup | `0 2 * * *` (daily 2 AM) | Prune notifications older than 30 days |

---

## Deployment & Infrastructure

```mermaid
graph TB
    subgraph Build["Build Pipeline"]
        Vite["Vite Build<br/>(Frontend → dist/public)"]
        TSC["TypeScript Compile<br/>(Backend → dist/)"]
        CopyAssets["Copy Migrations & Scripts"]
    end

    subgraph DockerBuild["Docker Image"]
        Stage1["Stage 1: Builder<br/>Node 24, npm ci, build"]
        Stage2["Stage 2: Runtime<br/>Node 24, npm ci --omit=dev"]
    end

    subgraph Runtime["Container Runtime"]
        Startup["startup.sh"]
        MainProc["Main Process<br/>(Hono Server)"]
        WorkerProc["Worker Process<br/>(Plate Solving)"]
    end

    subgraph Volumes["Docker Volumes"]
        Config["/app/config<br/>DB + Settings"]
        Sidecars["/app/sidecars<br/>XMP Files"]
        Cache["/app/cache<br/>Thumbnails"]
        Logs["/app/logs"]
        ImmichMount["/immich-upload<br/>Shared with Immich"]
    end

    Vite --> Stage1
    TSC --> Stage1
    CopyAssets --> Stage1
    Stage1 --> Stage2
    Stage2 --> Startup
    Startup --> MainProc
    Startup --> WorkerProc
    MainProc --> Volumes
    WorkerProc --> Volumes

    style Build fill:#2563eb,color:#fff
    style DockerBuild fill:#059669,color:#fff
    style Runtime fill:#d97706,color:#fff
    style Volumes fill:#7c3aed,color:#fff
```

### Docker Compose Configurations

| File | Database | Use Case |
|------|----------|----------|
| `docker-compose.yml` | SQLite | Default — single container, no dependencies |
| `docker-compose.postgres.yml` | PostgreSQL | Override — adds postgres service |
| `docker-compose.prod.yml` | SQLite | Production variant with additional configs |

### Container Details

- **Base Image**: Node 24 (multi-stage build)
- **Non-root User**: `skymmich` (UID 1001)
- **Health Check**: `curl http://localhost:5000/api/health`
- **PUID/PGID Remapping**: Supports Unraid-style user mapping
- **Multi-arch**: Builds for `amd64` and `arm64`
- **Startup Script**: Handles DB readiness, migrations, process management, and graceful shutdown

### Key Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | _(unset = SQLite)_ |
| `SQLITE_DB_PATH` | SQLite file location | `/app/config/skymmich.db` |
| `XMP_SIDECAR_PATH` | XMP output directory | `/app/sidecars` |
| `IMMICH_MAPPING_PATH` | Immich internal path prefix | `/usr/src/app/upload` |
| `LOCAL_MAPPING_PATH` | Local mount equivalent | `/immich-upload` |
| `ENABLE_PLATE_SOLVING` | Enable worker process | `true` |

---

## CI/CD Pipeline

```mermaid
graph LR
    subgraph Triggers["Triggers"]
        Push["Push to main"]
        Tag["Tag v*.*.*"]
        PR["Pull Request"]
    end

    subgraph BuildSteps["Build Pipeline"]
        TypeCheck["TypeScript Check"]
        Build["Vite + Backend Build"]
        DockerBuild["Multi-arch Docker Build<br/>(amd64 + arm64)"]
    end

    subgraph Publish["Publish"]
        GHCR["GHCR Push<br/>ghcr.io/skymmich/skymmich"]
        GHRelease["GitHub Release<br/>+ Artifacts + SBOM"]
    end

    subgraph Maintenance["Maintenance"]
        PruneJob["Weekly GHCR Prune<br/>(preserve release tags)"]
        PostBuildPrune["Post-build Prune<br/>(old non-release images)"]
    end

    Push --> TypeCheck --> Build --> DockerBuild
    Tag --> TypeCheck --> Build --> DockerBuild
    PR --> TypeCheck --> Build

    DockerBuild -->|"main push"| GHCR
    DockerBuild -->|"tag push"| GHCR
    DockerBuild -->|"tag push"| GHRelease

    GHCR --> PostBuildPrune
    PruneJob --> GHCR

    style Triggers fill:#2563eb,color:#fff
    style BuildSteps fill:#059669,color:#fff
    style Publish fill:#d97706,color:#fff
    style Maintenance fill:#6b7280,color:#fff
```

### Docker Image Tags

| Trigger | Tags Applied |
|---------|-------------|
| Push to main | `main`, `sha-<commit>`, timestamp |
| Version tag (e.g., `v0.9.2`) | `latest`, `0.9.2`, `0.9`, `0` |

---

## Security Considerations

### API Key Management

```mermaid
graph LR
    subgraph Storage["API Key Storage"]
        DB["Database<br/>(adminSettings)"]
        Env["Environment Variables"]
    end

    subgraph Access["Access Control"]
        GET["GET /api/system/settings"]
        POST["POST /api/system/settings"]
    end

    DB --> GET
    GET -->|"Masked: ••••abcd"| Client["Client"]
    Client -->|"Full key or masked"| POST
    POST -->|"If masked, preserve original"| DB
    Env -->|"Override DB values"| Services["Services"]

    style Storage fill:#7c3aed,color:#fff
    style Access fill:#059669,color:#fff
```

- **No user authentication**: Single-user application (designed for self-hosted use)
- **API key masking**: Keys are redacted in API responses (only last 4 characters shown)
- **Preservation on save**: If a masked key is submitted back, the server preserves the original
- **Non-root container**: Runtime user is `skymmich` (UID 1001)
- **URL validation**: Immich host validated as proper HTTP/HTTPS URL
- **External auth**: Astrometry.net uses session tokens; Immich uses `X-API-Key` header

---

## Request Lifecycle

End-to-end flow for a typical user interaction — viewing and plate-solving an image:

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Hono as Hono Server
    participant Storage as DbStorage
    participant DB as Database
    participant Worker
    participant Astro as Astrometry.net
    participant WS as WebSocket

    Note over User,WS: 1. View Image Gallery
    User->>Browser: Navigate to Home
    Browser->>Hono: GET /api/images?objectType=galaxy
    Hono->>Storage: getImages(filters)
    Storage->>DB: SELECT with joins & filters
    DB-->>Storage: Image rows
    Storage-->>Hono: Image list
    Hono-->>Browser: JSON response
    Browser->>Browser: Render gallery (TanStack Query cache)

    Note over User,WS: 2. Submit for Plate Solving
    User->>Browser: Click "Plate Solve"
    Browser->>Hono: POST /api/plate-solving/images/42/plate-solve
    Hono->>Storage: Create plateSolvingJob (status: pending)
    Hono-->>Browser: 200 OK

    Note over User,WS: 3. Background Processing
    Worker->>DB: Poll for pending jobs
    DB-->>Worker: Job #42
    Worker->>Astro: Login + Submit image
    Astro-->>Worker: Job ID
    Worker->>WS: { event: "plate-solving-update", status: "processing" }
    WS-->>Browser: Broadcast

    loop Poll until complete
        Worker->>Astro: Check job status
        Astro-->>Worker: Still processing...
    end

    Astro-->>Worker: Calibration results
    Worker->>DB: Update image (RA, Dec, constellation, etc.)
    Worker->>DB: Update job (status: success)
    Worker->>WS: { event: "plate-solving-update", status: "success" }
    WS-->>Browser: Broadcast
    Browser->>Browser: Invalidate queries, show results
```
