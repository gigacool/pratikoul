# Back-End Application Specification

## Table of Contents
1. [Overview](#overview)
2. [Key Features & UX Improvements](#key-features--ux-improvements)
3. [Architecture Principles](#architecture-principles)
4. [API Discovery (Root Endpoint)](#api-discovery-root-endpoint)
5. [Existing Implementation: Metrics Domain](#existing-implementation-metrics-domain)
6. [KPI Domain Specification](#kpi-domain-specification)
7. [Dashboard Domain Specification](#dashboard-domain-specification)
8. [Enhanced Metrics Features](#enhanced-metrics-features)
9. [Authentication & Authorization](#authentication--authorization)
10. [Validation Rules Design](#validation-rules-design)
11. [API Design Principles](#api-design-principles)
12. [Implementation Guidelines](#implementation-guidelines)
13. [Testing Requirements](#testing-requirements)
14. [Future Considerations](#future-considerations)

---

## Overview

This is a **NestJS RESTful API** application designed to manage business metrics, KPIs, and dashboards. The application follows **Domain-Driven Design (DDD)** principles with a **file-based repository** implementation (to be migrated to a database later).

### Core Domains
- **Metrics**: Define and store time-series metric values
- **KPI**: Define targets and thresholds associated with metrics
- **Dashboards**: Configure tile-based layouts to visualize metrics and KPIs

---

## Key Features & UX Improvements

This section highlights the developer experience (DX) and user experience (UX) improvements specified in this document.

### 1. API Discovery (HATEOAS Root Endpoint)

**Problem Solved**: Developers need to know what endpoints are available without reading documentation.

**Solution**: `GET /` returns a discovery document listing all resource collections:
```json
{
  "_links": {
    "metrics": { "href": "/metrics" },
    "kpis": { "href": "/kpis" },
    "dashboards": { "href": "/dashboards" },
    "auth": { "href": "/auth/login" }
  }
}
```

**Benefits**:
- Self-documenting API
- Easy integration with API explorers and auto-generated clients
- Follows REST best practices

### 2. KPI-Metric Relationship Discovery

**Problem Solved**: Users need to see which KPIs are associated with a metric when:
- Creating dashboard tiles
- Analyzing metric performance
- Setting up alerts

**Solution**: Bidirectional navigation via HATEOAS links:

**From Metric → KPIs**:
```json
GET /metrics/metric-uuid-1
{
  "uuid": "metric-uuid-1",
  "name": "Monthly Sales",
  "_links": {
    "kpis": { "href": "/kpis/by-metric/metric-uuid-1", "title": "Related KPIs" }
  }
}
```

**From KPI → Metric**:
```json
GET /kpis/kpi-uuid-1
{
  "uuid": "kpi-uuid-1",
  "metricUuid": "metric-uuid-1",
  "_links": {
    "metric": { "href": "/metrics/metric-uuid-1", "title": "Related Metric" }
  }
}
```

**Special Endpoint**: `GET /kpis/by-metric/:metricUuid` returns all KPIs for a metric:
```json
{
  "metricUuid": "metric-uuid-1",
  "metricName": "Monthly Sales",
  "kpis": [
    { "uuid": "kpi-uuid-1", "name": "Q4 Target", ... },
    { "uuid": "kpi-uuid-2", "name": "Monthly Ramp-Up", ... }
  ]
}
```

**Benefits**:
- Easy to build metric/KPI picker UI components
- Clear relationship between data and targets
- Supports multiple KPIs per metric (flexible use cases)

### 3. Simplified Authentication (In-Memory Users)

**Problem Solved**: Need authentication for testing but don't want to build a full User domain yet.

**Solution**: In-memory user store in `AuthService` with 3 pre-configured users:
- `admin@example.com` / `admin123` (admin role)
- `viewer@example.com` / `viewer123` (viewer role)
- `demo@example.com` / `demo123` (admin role)

**Benefits**:
- ✅ Fast to implement and test
- ✅ Production-pattern compliant (JWT strategy, guards)
- ✅ Easy migration path to User domain later
- ✅ No database dependency during early development

### 4. CSV Import/Export for Metrics

**Problem Solved**: Bulk data operations are tedious via individual API calls.

**Solution**:
- **Import**: `POST /metrics/:id/values/import` (upload CSV file)
- **Export**: `GET /metrics/export?uuids[]=...&startDate=...&endDate=...`

**Benefits**:
- Batch import historical data
- Export for analysis in Excel/Google Sheets
- Reduce API call overhead for large datasets

### 5. Dashboard Data Endpoint

**Problem Solved**: Front-end needs to fetch data for all tiles in a dashboard with one request.

**Solution**: `GET /dashboards/:id/data?startDate=...&endDate=...` returns:
- Dashboard configuration (tiles, layout)
- All metric values for tiles (filtered by date range)
- All KPI data for tiles

**Benefits**:
- Single API call instead of N+1 queries
- Date filtering reduces payload size
- Optimized for dashboard rendering

### 6. Flexible KPI Targets

**Problem Solved**: KPIs need to support both static goals and time-driven ramp-ups.

**Solution**: Flexible `targets` array:
```json
{
  "targets": [
    { "value": 10000, "date": "2025-01-31", "label": "Jan" },
    { "value": 15000, "date": "2025-02-28", "label": "Feb" }
  ]
}
```

**Benefits**:
- Supports sales ramp-ups, phased goals, etc.
- Domain service can calculate "current target" based on date
- Extensible for future KPI types

### 7. Validation at Multiple Layers

**Problem Solved**: Need to enforce business rules without duplicating validation logic.

**Solution**: Validation happens at:
1. **DTO layer**: Structure validation (class-validator)
2. **Domain service**: Business rules (min/max, chronological order, metric-specific rules)
3. **Repository layer**: Data integrity (uniqueness, referential integrity)

**Benefits**:
- Clear separation of concerns
- Easy to test validation logic
- Consistent error messages

---

## Architecture Principles

### DDD Structure
Each domain follows this layered architecture:

```
src/
  {domain}/
    domain/
      entities/          # Domain entities (business models)
      enums/            # Domain enums
      repositories/     # Abstract repository interfaces
      services/         # Domain services (business logic)
    application/
      dto/              # Data Transfer Objects
      use-cases/        # Application use cases (orchestration)
    infrastructure/
      repositories/     # Concrete repository implementations
    __tests__/          # Tests (controller, e2e)
    {domain}.module.ts  # NestJS module
    {domain}.controller.ts  # HTTP controllers
```

### Key Principles
1. **Separation of Concerns**: Domain logic is isolated from infrastructure
2. **Dependency Inversion**: Controllers and use-cases depend on abstractions (repositories)
3. **Entity Integrity**: Entities encapsulate business rules and validation
4. **Repository Pattern**: Abstract data access behind repository interfaces
5. **Use Case Pattern**: Orchestrate domain services and repositories

---

## API Discovery (Root Endpoint)

### Purpose
Provide a **HATEOAS-compliant discovery endpoint** at the root of the API that lists all available resources and their collection endpoints.

### Root Endpoint

**GET `/`**

**Response**:
```json
{
  "name": "Metrics & KPI API",
  "version": "1.0.0",
  "description": "RESTful API for managing business metrics, KPIs, and dashboards",
  "_links": {
    "self": { "href": "/" },
    "metrics": {
      "href": "/metrics",
      "title": "Metrics collection"
    },
    "kpis": {
      "href": "/kpis",
      "title": "KPIs collection"
    },
    "dashboards": {
      "href": "/dashboards",
      "title": "Dashboards collection"
    },
    "auth": {
      "href": "/auth/login",
      "title": "Authentication endpoint"
    }
  }
}
```

### Implementation

**File**: `src/app.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiDiscovery() {
    return {
      name: 'Metrics & KPI API',
      version: '1.0.0',
      description: 'RESTful API for managing business metrics, KPIs, and dashboards',
      _links: {
        self: { href: '/' },
        metrics: {
          href: '/metrics',
          title: 'Metrics collection'
        },
        kpis: {
          href: '/kpis',
          title: 'KPIs collection'
        },
        dashboards: {
          href: '/dashboards',
          title: 'Dashboards collection'
        },
        auth: {
          href: '/auth/login',
          title: 'Authentication endpoint'
        }
      }
    };
  }
}
```

**Benefits**:
- API clients can discover available resources dynamically
- Follows REST HATEOAS principles
- Makes API self-documenting
- Useful for API exploration tools and auto-generated clients

---

## Existing Implementation: Metrics Domain

### Entity: Metric
**File**: `src/metrics/domain/entities/metric.entity.ts`

```typescript
import { MetricValueType } from '../enums/metric-value-type.enum';
import { MetricAggregation } from '../enums/metric-aggregation.enum';

export interface MetricValue {
  value: number;
  timestamp: string; // ISO 8601 date string
}

export class Metric {
  constructor(
    public readonly uuid: string,
    public name: string,
    public description: string,
    public valueType: MetricValueType,
    public unit: string,
    public values: MetricValue[],
    public aggregation: MetricAggregation,
    public tags: string[],
  ) {}
}
```

### Enums

**MetricValueType** (`src/metrics/domain/enums/metric-value-type.enum.ts`):
```typescript
export enum MetricValueType {
  Currency = 'currency',
  Percentage = 'percentage',
  Integer = 'integer',
  Decimal = 'decimal',
  Status = 'status',
}
```

**MetricAggregation** (`src/metrics/domain/enums/metric-aggregation.enum.ts`):
```typescript
export enum MetricAggregation {
  Sum = 'sum',
  Latest = 'latest',
  Average = 'average',
  Median = 'median',
  Min = 'min',
  Max = 'max',
}
```

### Repository Pattern

**Abstract Repository** (`src/metrics/domain/repositories/metric.repository.ts`):
```typescript
export abstract class MetricRepository {
  abstract findAll(): Promise<Metric[]>;
  abstract findById(uuid: string): Promise<Metric | null>;
  abstract save(metric: Metric): Promise<void>;
  abstract update(uuid: string, metric: Partial<Metric>): Promise<void>;
}
```

**File-Based Implementation** (`src/metrics/infrastructure/repositories/file-metric.repository.ts`):
- Stores data in `.data/metrics.json`
- Implements all abstract methods
- Uses Node.js `fs.promises` for file I/O

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metrics` | Paginated list (query params: `page`, `limit`) |
| GET | `/metrics/:id` | Get single metric by UUID |
| POST | `/metrics` | Create new metric |
| PUT | `/metrics/:id` | Update metric |

### Response Format

**List Response** (with HATEOAS):
```json
{
  "items": [
    {
      "uuid": "metric-uuid-1",
      "name": "Monthly Sales",
      "lastTimestamp": "2025-10-01T00:00:00Z",
      "lastValue": 50000,
      "description": "Total monthly sales revenue",
      "_links": {
        "self": { "href": "/metrics/metric-uuid-1" },
        "kpis": { "href": "/kpis/by-metric/metric-uuid-1", "title": "Related KPIs" }
      }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "_links": {
    "first": { "href": "/metrics?page=1&limit=10" },
    "prev": { "href": "/metrics?page=0&limit=10" },
    "next": { "href": "/metrics?page=2&limit=10" },
    "last": { "href": "/metrics?page=5&limit=10" }
  }
}
```

**Detail Response** (with related KPIs link):
```json
{
  "uuid": "metric-uuid-1",
  "name": "Monthly Sales",
  "description": "Total monthly sales revenue",
  "valueType": "currency",
  "unit": "USD",
  "values": [
    { "value": 45000, "timestamp": "2025-09-01T00:00:00Z" },
    { "value": 50000, "timestamp": "2025-10-01T00:00:00Z" }
  ],
  "aggregation": "sum",
  "tags": ["sales", "revenue"],
  "_links": {
    "self": { "href": "/metrics/metric-uuid-1" },
    "kpis": { "href": "/kpis/by-metric/metric-uuid-1", "title": "Related KPIs" },
    "values": { "href": "/metrics/metric-uuid-1/values" },
    "import": { "href": "/metrics/metric-uuid-1/values/import" }
  }
}
```

---

## KPI Domain Specification

### Purpose
KPIs (Key Performance Indicators) define **target values** associated with metrics. A KPI references a metric and specifies goals, thresholds, and tracking periods.

### Entity: KPI
**File**: `src/kpi/domain/entities/kpi.entity.ts`

```typescript
export interface KpiTarget {
  value: number;          // Target value
  date?: string;          // Optional: ISO 8601 date for time-driven targets
  label?: string;         // Optional: Human-readable label (e.g., "Q1 Target")
}

export enum KpiStatus {
  Active = 'active',
  Archived = 'archived',
  Completed = 'completed',
}

export interface KpiThresholds {
  warning?: number;       // Warning threshold value
  critical?: number;      // Critical threshold value
}

export class Kpi {
  constructor(
    public readonly uuid: string,
    public name: string,
    public description: string,
    public metricUuid: string,           // Reference to parent metric
    public targets: KpiTarget[],         // Flexible: static or time-driven
    public status: KpiStatus,
    public thresholds?: KpiThresholds,   // Optional alert thresholds
    public readonly createdAt: string,   // ISO 8601
    public updatedAt: string,            // ISO 8601
  ) {}
}
```

### Target Structure Examples

**Static Target** (single value to reach):
```json
{
  "targets": [
    { "value": 100000, "label": "Annual Revenue Goal" }
  ]
}
```

**Time-Driven Target** (ramp-up):
```json
{
  "targets": [
    { "value": 10000, "date": "2025-01-31", "label": "Month 1" },
    { "value": 20000, "date": "2025-02-28", "label": "Month 2" },
    { "value": 30000, "date": "2025-03-31", "label": "Month 3" }
  ]
}
```

### DTO Structure

**File**: `src/kpi/application/dto/kpi.dto.ts`

```typescript
export class KpiTargetDto {
  value: number;
  date?: string;
  label?: string;
}

export class KpiThresholdsDto {
  warning?: number;
  critical?: number;
}

export class KpiDto {
  uuid?: string;
  name: string;
  description: string;
  metricUuid: string;
  targets: KpiTargetDto[];
  status: KpiStatus;
  thresholds?: KpiThresholdsDto;
}

export class KpiListItemDto {
  uuid: string;
  name: string;
  description: string;
  metricUuid: string;
  status: KpiStatus;
  currentTarget?: number;  // Most relevant target based on current date
  _links: {
    self: { href: string };
    metric: { href: string };
  };
}
```

### Repository Interface

**File**: `src/kpi/domain/repositories/kpi.repository.ts`

```typescript
export abstract class KpiRepository {
  abstract findAll(): Promise<Kpi[]>;
  abstract findById(uuid: string): Promise<Kpi | null>;
  abstract findByMetricUuid(metricUuid: string): Promise<Kpi[]>;
  abstract save(kpi: Kpi): Promise<void>;
  abstract update(uuid: string, kpi: Partial<Kpi>): Promise<void>;
  abstract delete(uuid: string): Promise<void>;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/kpis` | Paginated list (query: `page`, `limit`, `status`) |
| GET | `/kpis/:id` | Get single KPI by UUID |
| GET | `/kpis/by-metric/:metricUuid` | Get all KPIs associated with a specific metric |
| POST | `/kpis` | Create new KPI |
| PUT | `/kpis/:id` | Update KPI |
| DELETE | `/kpis/:id` | Delete KPI (soft delete: set status to `archived`) |

### Response Format Examples

**List Response**:
```json
{
  "items": [
    {
      "uuid": "kpi-uuid-1",
      "name": "Q4 Sales Target",
      "description": "Quarterly sales goal",
      "metricUuid": "metric-uuid-1",
      "status": "active",
      "currentTarget": 100000,
      "_links": {
        "self": { "href": "/kpis/kpi-uuid-1" },
        "metric": { "href": "/metrics/metric-uuid-1", "title": "Related Metric" }
      }
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "_links": {
    "first": { "href": "/kpis?page=1&limit=10" },
    "next": { "href": "/kpis?page=2&limit=10" },
    "last": { "href": "/kpis?page=2&limit=10" }
  }
}
```

**Get KPIs by Metric** (`GET /kpis/by-metric/metric-uuid-1`):
```json
{
  "metricUuid": "metric-uuid-1",
  "metricName": "Monthly Sales",
  "kpis": [
    {
      "uuid": "kpi-uuid-1",
      "name": "Q4 Sales Target",
      "description": "Quarterly sales goal",
      "status": "active",
      "targets": [
        { "value": 100000, "date": "2025-12-31", "label": "Q4 Goal" }
      ],
      "thresholds": {
        "warning": 80000,
        "critical": 60000
      },
      "_links": {
        "self": { "href": "/kpis/kpi-uuid-1" }
      }
    },
    {
      "uuid": "kpi-uuid-2",
      "name": "Monthly Ramp-Up",
      "description": "Progressive monthly targets",
      "status": "active",
      "targets": [
        { "value": 10000, "date": "2025-10-31", "label": "Oct" },
        { "value": 15000, "date": "2025-11-30", "label": "Nov" },
        { "value": 20000, "date": "2025-12-31", "label": "Dec" }
      ],
      "_links": {
        "self": { "href": "/kpis/kpi-uuid-2" }
      }
    }
  ],
  "_links": {
    "metric": { "href": "/metrics/metric-uuid-1" }
  }
}
```

**Use Case**: This endpoint helps users:
- See all targets associated with a metric when configuring dashboards
- Pick relevant KPIs when creating dashboard tiles
- Understand the relationship between metrics and their performance targets

### Business Rules & Validation

1. **Metric Reference Validation**: `metricUuid` must exist in metrics
2. **Target Validation**:
   - At least one target required
   - Date-based targets must be in chronological order
   - Target values should align with metric's `valueType` (e.g., percentage: 0-100)
3. **Threshold Validation**:
   - `warning < critical` (if both specified)
   - Thresholds should align with metric's `valueType`
4. **Status Transitions**:
   - `active` → `completed` (when target reached)
   - `active` → `archived` (when no longer relevant)

### Domain Service

**File**: `src/kpi/domain/services/kpi.service.ts`

Key methods:
- `calculateCurrentTarget(kpi: Kpi, currentDate: Date): number | null` - Find most relevant target
- `evaluateStatus(kpi: Kpi, currentMetricValue: number): 'on-track' | 'warning' | 'critical'`
- `validateTargets(targets: KpiTarget[]): void` - Validate target structure

---

## Dashboard Domain Specification

### Purpose
Dashboards provide configurable tile-based layouts to visualize metrics and KPIs using **react-grid-layout** on the front-end.

### Entity: Dashboard

**File**: `src/dashboards/domain/entities/dashboard.entity.ts`

```typescript
export enum TileType {
  SingleMetric = 'single-metric',       // Display one metric
  MultiMetric = 'multi-metric',         // Display multiple metrics (comparison)
  KpiTracker = 'kpi-tracker',           // Display KPI with target progress
  MetricWithKpi = 'metric-with-kpi',    // Metric value + associated KPI
  Chart = 'chart',                      // Time-series chart
}

export interface TileConfig {
  id: string;                           // Unique tile ID
  x: number;                            // Grid position X
  y: number;                            // Grid position Y
  w: number;                            // Width (grid units)
  h: number;                            // Height (grid units)
  type: TileType;                       // Tile visualization type
  metricUuids: string[];                // Referenced metrics
  kpiUuids?: string[];                  // Optional: referenced KPIs
  config?: Record<string, any>;         // Additional visualization config
}

export class Dashboard {
  constructor(
    public readonly uuid: string,
    public name: string,
    public description: string,
    public tiles: TileConfig[],
    public isShared: boolean,             // Prepare for future user ownership
    public readonly createdAt: string,    // ISO 8601
    public updatedAt: string,             // ISO 8601
  ) {}
}
```

### DTO Structure

**File**: `src/dashboards/application/dto/dashboard.dto.ts`

```typescript
export class TileConfigDto {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: TileType;
  metricUuids: string[];
  kpiUuids?: string[];
  config?: Record<string, any>;
}

export class DashboardDto {
  uuid?: string;
  name: string;
  description: string;
  tiles: TileConfigDto[];
  isShared: boolean;
}

export class DashboardListItemDto {
  uuid: string;
  name: string;
  description: string;
  tileCount: number;
  isShared: boolean;
  updatedAt: string;
  _links: {
    self: { href: string };
    data: { href: string };
  };
}
```

### React-Grid-Layout Sample

**Example Dashboard Configuration**:
```json
{
  "uuid": "dashboard-001",
  "name": "Sales Dashboard",
  "description": "Monthly sales metrics and KPIs",
  "isShared": true,
  "tiles": [
    {
      "id": "tile-1",
      "x": 0,
      "y": 0,
      "w": 4,
      "h": 2,
      "type": "single-metric",
      "metricUuids": ["metric-uuid-1"],
      "config": {
        "showTrend": true,
        "comparisonPeriod": "month"
      }
    },
    {
      "id": "tile-2",
      "x": 4,
      "y": 0,
      "w": 4,
      "h": 2,
      "type": "metric-with-kpi",
      "metricUuids": ["metric-uuid-2"],
      "kpiUuids": ["kpi-uuid-1"],
      "config": {
        "showProgress": true
      }
    },
    {
      "id": "tile-3",
      "x": 0,
      "y": 2,
      "w": 8,
      "h": 4,
      "type": "chart",
      "metricUuids": ["metric-uuid-1", "metric-uuid-2"],
      "config": {
        "chartType": "line",
        "showLegend": true
      }
    }
  ],
  "createdAt": "2025-10-01T00:00:00Z",
  "updatedAt": "2025-10-01T00:00:00Z"
}
```

### Repository Interface

**File**: `src/dashboards/domain/repositories/dashboard.repository.ts`

```typescript
export abstract class DashboardRepository {
  abstract findAll(): Promise<Dashboard[]>;
  abstract findById(uuid: string): Promise<Dashboard | null>;
  abstract save(dashboard: Dashboard): Promise<void>;
  abstract update(uuid: string, dashboard: Partial<Dashboard>): Promise<void>;
  abstract delete(uuid: string): Promise<void>;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboards` | Paginated list (query: `page`, `limit`) |
| GET | `/dashboards/:id` | Get single dashboard configuration |
| GET | `/dashboards/:id/data` | Get dashboard data with metric/KPI values (supports `startDate`, `endDate`) |
| POST | `/dashboards` | Create new dashboard |
| PUT | `/dashboards/:id` | Update dashboard |
| DELETE | `/dashboards/:id` | Delete dashboard |

### Dashboard Data Endpoint

**GET `/dashboards/:id/data?startDate=2025-01-01&endDate=2025-12-31`**

Response structure:
```json
{
  "dashboard": {
    "uuid": "...",
    "name": "Sales Dashboard",
    "tiles": [...]
  },
  "data": {
    "metrics": {
      "metric-uuid-1": {
        "uuid": "metric-uuid-1",
        "name": "Monthly Sales",
        "values": [
          { "value": 10000, "timestamp": "2025-01-01T00:00:00Z" },
          { "value": 15000, "timestamp": "2025-02-01T00:00:00Z" }
        ]
      }
    },
    "kpis": {
      "kpi-uuid-1": {
        "uuid": "kpi-uuid-1",
        "name": "Sales Target",
        "targets": [
          { "value": 12000, "date": "2025-01-31", "label": "Jan Target" }
        ],
        "currentStatus": "on-track"
      }
    }
  }
}
```

### Business Rules & Validation

1. **Tile Validation**:
   - All `metricUuids` must reference existing metrics
   - All `kpiUuids` must reference existing KPIs
   - Tile IDs must be unique within a dashboard
   - Grid positions must not have negative values
2. **Layout Validation**:
   - Tiles should not overlap (validate on save)
   - Grid dimensions should be reasonable (e.g., max w=12, max h=12)
3. **Data Filtering**:
   - `startDate` and `endDate` are optional query parameters
   - If specified, filter metric values by timestamp range
   - Default: return last 30 days if no dates provided

---

## Enhanced Metrics Features

### 1. Validation Rules

Add optional validation rules to the Metric entity.

**Updated Metric Entity**:
```typescript
export interface MetricValidationRules {
  min?: number;                    // Minimum allowed value
  max?: number;                    // Maximum allowed value
  allowNegative?: boolean;         // Allow negative values (default: true)
  requiredFrequency?: 'daily' | 'weekly' | 'monthly';  // Expected data frequency
}

export class Metric {
  constructor(
    public readonly uuid: string,
    public name: string,
    public description: string,
    public valueType: MetricValueType,
    public unit: string,
    public values: MetricValue[],
    public aggregation: MetricAggregation,
    public tags: string[],
    public validationRules?: MetricValidationRules,  // NEW
  ) {}
}
```

**Validation Logic** (in `MetricService`):
```typescript
validateMetricValue(metric: Metric, value: number): void {
  if (!metric.validationRules) return;

  const rules = metric.validationRules;

  if (rules.min !== undefined && value < rules.min) {
    throw new Error(`Value ${value} is below minimum ${rules.min}`);
  }

  if (rules.max !== undefined && value > rules.max) {
    throw new Error(`Value ${value} exceeds maximum ${rules.max}`);
  }

  if (!rules.allowNegative && value < 0) {
    throw new Error(`Negative values are not allowed for this metric`);
  }

  // Additional validation for valueType
  if (metric.valueType === MetricValueType.Percentage && (value < 0 || value > 100)) {
    throw new Error(`Percentage values must be between 0 and 100`);
  }
}
```

### 2. CSV Import Endpoint

**POST `/metrics/:id/values/import`**

**Request** (multipart/form-data):
- `file`: CSV file with columns `timestamp,value`

**CSV Format**:
```csv
timestamp,value
2025-01-01T00:00:00Z,10000
2025-01-02T00:00:00Z,15000
2025-01-03T00:00:00Z,12000
```

**Implementation Steps**:
1. Parse CSV file using `csv-parser` or `papaparse`
2. Validate each row:
   - Valid ISO 8601 timestamp
   - Valid numeric value
   - Passes metric validation rules
3. Append values to metric's `values` array
4. Save updated metric

**Response**:
```json
{
  "status": "imported",
  "imported": 150,
  "failed": 2,
  "errors": [
    { "row": 5, "reason": "Invalid timestamp format" },
    { "row": 12, "reason": "Value exceeds maximum" }
  ]
}
```

### 3. CSV Export Endpoint

**GET `/metrics/export?uuids[]=metric-1&uuids[]=metric-2&startDate=2025-01-01&endDate=2025-12-31`**

**Response** (text/csv):
```csv
metricUuid,metricName,timestamp,value,unit
metric-1,Monthly Sales,2025-01-01T00:00:00Z,10000,USD
metric-1,Monthly Sales,2025-02-01T00:00:00Z,15000,USD
metric-2,Conversion Rate,2025-01-01T00:00:00Z,5.2,%
```

**Implementation**:
1. Accept array of metric UUIDs
2. Filter values by date range if provided
3. Generate CSV with headers
4. Set response headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename=metrics-export.csv`

### 4. Manage Metric Values

**DELETE `/metrics/:id/values?startDate=&endDate=`**

Delete values within a date range (useful for correcting errors).

**Request**:
```
DELETE /metrics/metric-uuid-1/values?startDate=2025-01-01&endDate=2025-01-31
```

**Response**:
```json
{
  "status": "deleted",
  "deletedCount": 25
}
```

---

## Authentication & Authorization

### Approach: NestJS Passport + JWT

**Strategy**: Use **JWT (JSON Web Tokens)** for stateless authentication, with OAuth2 readiness for future integration.

### Implementation Steps

1. **Install Dependencies**:
```bash
npm install @nestjs/passport @nestjs/jwt passport passport-jwt
npm install -D @types/passport-jwt
```

2. **Create Auth Module**:

**File**: `src/auth/auth.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
```

3. **JWT Strategy**:

**File**: `src/auth/strategies/jwt.strategy.ts`
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;      // User ID
  email: string;
  role?: string;    // Future: 'admin' | 'viewer'
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

4. **JWT Guard**:

**File**: `src/auth/guards/jwt-auth.guard.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

5. **Protect Routes**:

**Example**: Apply guard to controllers
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('metrics')
@UseGuards(JwtAuthGuard)  // Protect all routes
export class MetricsController {
  // ... routes
}
```

6. **Login Endpoint** (Simple Implementation):

**File**: `src/auth/auth.controller.ts`
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    // For now: simple hardcoded check (replace with real user lookup)
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }
}
```

**File**: `src/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
}

@Injectable()
export class AuthService {
  // In-memory user store for test phase
  // TODO: Replace with database-backed User domain later
  private readonly users: User[] = [
    {
      id: 'user-1',
      email: 'admin@example.com',
      password: 'admin123', // TODO: Hash passwords in production
      role: 'admin'
    },
    {
      id: 'user-2',
      email: 'viewer@example.com',
      password: 'viewer123',
      role: 'viewer'
    },
    {
      id: 'user-3',
      email: 'demo@example.com',
      password: 'demo123',
      role: 'admin'
    }
  ];

  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'>> {
    const user = this.users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: Omit<User, 'password'>) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  // Helper method to add users during testing (optional)
  async registerUser(email: string, password: string, role: string = 'viewer'): Promise<void> {
    const existingUser = this.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: `user-${this.users.length + 1}`,
      email,
      password, // TODO: Hash in production
      role
    };

    this.users.push(newUser);
  }
}
```

**Test Users** (available by default):
| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | admin |
| viewer@example.com | viewer123 | viewer |
| demo@example.com | demo123 | admin |

7. **Environment Variables**:

Add to `.env`:
```env
JWT_SECRET=your-super-secret-key-change-in-production
```

### Why In-Memory User Store for Test Phase?

**Benefits**:
- ✅ **Simple**: No need to create User domain, repository, or database schema yet
- ✅ **Fast**: Quick to implement and test authentication flows
- ✅ **Production-Pattern Compliant**: Uses proper JWT strategy and guards
- ✅ **Easy Migration**: When ready, extract to User domain with minimal changes

**Migration Path** (when ready for production):
1. Create `User` domain with entity, repository, service
2. Hash passwords using `bcrypt`
3. Replace in-memory array with repository calls in `AuthService`
4. Add user registration endpoint
5. All JWT logic, guards, and protected routes remain unchanged

### OAuth2 Readiness

For future OAuth2 integration (e.g., Google, GitHub):
1. Install `passport-oauth2` or provider-specific strategy
2. Add OAuth callback route
3. Exchange OAuth token for JWT
4. Maintain same JWT-based session management

### Future Role-Based Access Control (RBAC)

**Decorator**: `src/auth/decorators/roles.decorator.ts`
```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**Guard**: `src/auth/guards/roles.guard.ts`
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return roles.includes(user.role);
  }
}
```

**Usage**:
```typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async deleteMetric(@Param('id') id: string) {
  // Only admins can delete
}
```

---

## Validation Rules Design

### Where to Enforce Validation

Validation should occur at **multiple layers**:

1. **DTO Layer** (Input validation):
   - Use `class-validator` decorators
   - Validate structure, types, required fields

2. **Domain Service Layer** (Business logic validation):
   - Validate business rules (e.g., min/max values, chronological order)
   - Enforce domain-specific constraints
   - This is where `MetricValidationRules` are checked

3. **Repository Layer** (Data integrity):
   - Validate uniqueness constraints
   - Check referential integrity

### Example: DTO Validation

Install `class-validator` and `class-transformer`:
```bash
npm install class-validator class-transformer
```

Enable validation globally in `main.ts`:
```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true,            // Auto-transform payloads to DTO instances
  }));
  await app.listen(3000);
}
```

**Enhanced DTO with Validation**:
```typescript
import { IsString, IsEnum, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class MetricDto {
  @IsOptional()
  @IsString()
  uuid?: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(MetricValueType)
  valueType: MetricValueType;

  @IsString()
  unit: string;

  @IsArray()
  values: MetricValueDto[];

  @IsEnum(MetricAggregation)
  aggregation: MetricAggregation;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  validationRules?: MetricValidationRulesDto;
}

export class MetricValidationRulesDto {
  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;

  @IsOptional()
  allowNegative?: boolean;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  requiredFrequency?: 'daily' | 'weekly' | 'monthly';
}
```

### Domain Validation Example

In `MetricService`, validate before saving:
```typescript
async create(metric: Metric): Promise<void> {
  // Validate metric values against rules
  metric.values.forEach(v => this.validateMetricValue(metric, v.value));

  // Check for chronological order
  this.validateChronologicalOrder(metric.values);

  await this.repository.save(metric);
}

private validateChronologicalOrder(values: MetricValue[]): void {
  for (let i = 1; i < values.length; i++) {
    if (new Date(values[i].timestamp) < new Date(values[i - 1].timestamp)) {
      throw new Error('Metric values must be in chronological order');
    }
  }
}
```

---

## API Design Principles

### RESTful Conventions

1. **Resource Naming**: Use plural nouns (`/metrics`, `/kpis`, `/dashboards`)
2. **HTTP Methods**:
   - `GET`: Retrieve resources (safe, idempotent)
   - `POST`: Create new resources
   - `PUT`: Update existing resources (idempotent)
   - `DELETE`: Remove resources (idempotent)
3. **Status Codes**:
   - `200 OK`: Successful GET, PUT
   - `201 Created`: Successful POST
   - `204 No Content`: Successful DELETE
   - `400 Bad Request`: Invalid input
   - `401 Unauthorized`: Missing/invalid auth token
   - `403 Forbidden`: Insufficient permissions
   - `404 Not Found`: Resource doesn't exist
   - `422 Unprocessable Entity`: Validation errors
   - `500 Internal Server Error`: Unexpected errors

### HATEOAS (Hypermedia as the Engine of Application State)

Include `_links` in responses to guide API navigation:

```json
{
  "uuid": "metric-1",
  "name": "Monthly Sales",
  "_links": {
    "self": { "href": "/metrics/metric-1" },
    "values": { "href": "/metrics/metric-1/values" },
    "kpis": { "href": "/kpis/by-metric/metric-1" }
  }
}
```

### Pagination

For list endpoints, always support pagination:
- Query params: `page` (default: 1), `limit` (default: 10)
- Include pagination metadata in response

### Date Handling

- **Always use ISO 8601** format for dates: `2025-10-01T12:00:00Z`
- Accept dates as query parameters: `?startDate=2025-01-01&endDate=2025-12-31`
- Store dates as strings in ISO format

### Error Response Format

Standardize error responses:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "valueType",
      "message": "must be a valid enum value"
    }
  ]
}
```

---

## Implementation Guidelines

### Step 0: Update Root Endpoint (Quick Win)

1. **Update `app.controller.ts`**:
   - Replace existing `getHello()` method with `getApiDiscovery()`
   - Return HATEOAS discovery document as shown in [API Discovery section](#api-discovery-root-endpoint)
   - This makes the API self-documenting from the start

2. **Test**: `GET http://localhost:3000/` should return resource links

### Step 1: Implement KPI Domain

1. **Create Directory Structure**:
```
src/kpi/
  domain/
    entities/kpi.entity.ts
    repositories/kpi.repository.ts
    services/kpi.service.ts
  application/
    dto/kpi.dto.ts
    use-cases/kpi.use-case.ts
  infrastructure/
    repositories/file-kpi.repository.ts
  __tests__/
    kpi.controller.spec.ts
  kpi.module.ts
  kpi.controller.ts
```

2. **Copy Pattern from Metrics**:
   - Copy `metrics.module.ts` → `kpi.module.ts` (update class names)
   - Copy `metrics.controller.ts` → `kpi.controller.ts`
   - Copy `file-metric.repository.ts` → `file-kpi.repository.ts`
   - Update file path: `.data/kpis.json`

3. **Implement Entity**: Use specification above (with `KpiStatus`, `KpiTarget`, `KpiThresholds`)

4. **Implement Repository**: Follow `MetricRepository` pattern, add `findByMetricUuid()` method

5. **Implement Service**:
   - `getListItems()`: Transform to `KpiListItemDto` with HATEOAS (include metric link)
   - `getById(uuid)`: Fetch single KPI
   - `getByMetricUuid(metricUuid)`: Fetch all KPIs for a metric (for `/kpis/by-metric/:metricUuid` endpoint)
   - `create(kpi)`: Validate and save
   - `update(uuid, partial)`: Update fields
   - `delete(uuid)`: Set status to `archived` (soft delete)
   - `calculateCurrentTarget(kpi, date)`: Find relevant target based on date
   - `evaluateStatus(kpi, metricValue)`: Compare value against thresholds

6. **Implement Controller**:
   - Standard CRUD routes: `GET /kpis`, `GET /kpis/:id`, `POST /kpis`, `PUT /kpis/:id`, `DELETE /kpis/:id`
   - **Add special route**: `GET /kpis/by-metric/:metricUuid` (returns all KPIs for a metric)

7. **Update Metrics Domain**:
   - Update `MetricListItemDto` to include `kpis` link in `_links`
   - Update `MetricService.getListItems()` to add HATEOAS link: `kpis: { href: /kpis/by-metric/${uuid} }`
   - Update metric detail response to include links to related KPIs

8. **Register in AppModule**: Add `KpiModule` to imports in `app.module.ts`

### Step 2: Implement Dashboard Domain

Follow same pattern as KPI domain:

1. Create directory structure
2. Implement entity with `TileConfig` interface
3. Implement repository with file storage (`.data/dashboards.json`)
4. Implement service with layout validation
5. Implement controller
6. **Add Data Endpoint**: `GET /dashboards/:id/data`
   - Fetch dashboard configuration
   - Extract all unique `metricUuids` and `kpiUuids` from tiles
   - Fetch metric values (filtered by date range)
   - Fetch KPI data
   - Return combined response
7. Register in AppModule

### Step 3: Enhance Metrics Domain

1. **Add Validation Rules**:
   - Update `Metric` entity
   - Update `MetricDto`
   - Add validation logic in `MetricService.create()` and `MetricService.update()`

2. **Add CSV Import Endpoint**:
   - Install CSV parser: `npm install csv-parser`
   - Add route: `POST /metrics/:id/values/import`
   - Parse and validate CSV
   - Append to metric values

3. **Add CSV Export Endpoint**:
   - Add route: `GET /metrics/export`
   - Query multiple metrics by UUID
   - Generate CSV response
   - Set appropriate headers

4. **Add Delete Values Endpoint**:
   - Add route: `DELETE /metrics/:id/values`
   - Filter values by date range
   - Update metric in repository

### Step 4: Implement Authentication

1. Install dependencies
2. Create `AuthModule`, `AuthService`, `AuthController`
3. Implement JWT strategy
4. Create guards
5. Protect routes with `@UseGuards(JwtAuthGuard)`
6. Test with Postman/curl

### Step 5: Add Validation

1. Install `class-validator` and `class-transformer`
2. Enable global validation pipe in `main.ts`
3. Add decorators to all DTOs
4. Add domain-specific validation in services

---

## Testing Requirements

### Unit Tests

For each domain service, write unit tests covering:
- Entity creation
- Validation logic
- Business rules
- Edge cases

**Example** (`kpi.service.spec.ts`):
```typescript
describe('KpiService', () => {
  let service: KpiService;
  let repository: KpiRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        KpiService,
        {
          provide: KpiRepository,
          useValue: {
            save: jest.fn(),
            findAll: jest.fn(),
            // ... mock other methods
          },
        },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
    repository = module.get<KpiRepository>(KpiRepository);
  });

  it('should calculate current target for time-driven KPI', () => {
    const kpi = new Kpi(
      'kpi-1',
      'Sales Target',
      'Monthly sales ramp-up',
      'metric-1',
      [
        { value: 10000, date: '2025-01-31', label: 'Jan' },
        { value: 20000, date: '2025-02-28', label: 'Feb' },
      ],
      KpiStatus.Active,
      undefined,
      '2025-01-01T00:00:00Z',
      '2025-01-01T00:00:00Z',
    );

    const target = service.calculateCurrentTarget(kpi, new Date('2025-02-15'));
    expect(target).toBe(20000);
  });
});
```

### E2E Tests (Controller Tests)

For each controller, write integration tests covering:
- CRUD operations
- Error handling
- Validation
- Pagination
- Authentication (if enabled)

**Pattern**: Follow `metrics.controller.spec.ts` as template

Key tests:
- Create resource (POST) → returns 201
- List resources (GET) → returns paginated data
- Get single resource (GET /:id) → returns resource
- Update resource (PUT /:id) → returns 200
- Delete resource (DELETE /:id) → returns 204
- Invalid input → returns 400
- Resource not found → returns 404

---

## Future Considerations

### 1. Database Migration

**Current**: File-based JSON storage in `.data/`

**Future**: Migrate to relational (PostgreSQL) or NoSQL (MongoDB)

**Steps**:
1. Create database entities/schemas
2. Implement database repositories (e.g., `TypeOrmMetricRepository`, `MongoKpiRepository`)
3. Swap implementation in module providers
4. Domain and application layers remain unchanged (thanks to repository pattern!)

### 2. User Ownership & Multi-Tenancy

**Requirements**:
- Add `User` domain
- Add `userId` or `tenantId` to Metric, KPI, Dashboard
- Filter all queries by user/tenant
- Implement sharing mechanisms (public vs. private dashboards)

**Database Changes**:
- Add foreign key: `user_id` to all domain tables
- Add `is_shared` flag (already present in Dashboard)

### 3. Real-Time Updates

**Approach**: WebSockets (Socket.io or NestJS Gateway)

**Use Cases**:
- Live dashboard updates when metric values change
- Notifications when KPI thresholds are breached

**Implementation**:
- Install `@nestjs/websockets`
- Create gateway for real-time events
- Emit events when data changes

### 4. Calculated Metrics

**Feature**: Define metrics as formulas based on other metrics

**Example**: `Conversion Rate = (Conversions / Visits) * 100`

**Implementation**:
- Add `formula` field to Metric entity
- Add `dependencies` array (referenced metric UUIDs)
- Compute values dynamically on read
- Store computed values for performance

### 5. Alert Notifications

**Feature**: Send notifications when KPI thresholds are exceeded

**Implementation**:
- Add `Alert` domain
- Add notification channels (email, Slack, webhook)
- Implement background job to check KPI status
- Trigger alerts when status changes

### 6. Data Retention Policies

**Feature**: Automatically archive or delete old metric values

**Implementation**:
- Add `retentionDays` field to Metric
- Schedule cron job to cleanup old values
- Use `@nestjs/schedule` for task scheduling

### 7. Advanced Visualizations

**Feature**: Support more tile types (heatmaps, gauges, tables)

**Implementation**:
- Extend `TileType` enum
- Add tile-specific configuration schemas
- Front-end handles rendering

### 8. Data Export Formats

Beyond CSV, support:
- JSON export
- Excel (XLSX) export
- API integration (webhook data push)

### 9. Audit Logging

**Feature**: Track all changes to metrics, KPIs, dashboards

**Implementation**:
- Add `AuditLog` domain
- Log create/update/delete operations
- Include user, timestamp, before/after values

### 10. API Versioning

**Best Practice**: Version API to maintain backward compatibility

**Approaches**:
- URI versioning: `/v1/metrics`, `/v2/metrics`
- Header versioning: `Accept: application/vnd.api+json;version=1`
- NestJS supports both via versioning feature

---

## Appendix: File System Structure

```
apps/back-end/
  .data/                          # File-based storage
    metrics.json
    kpis.json
    dashboards.json
  src/
    auth/                         # Authentication module
      guards/
        jwt-auth.guard.ts
        roles.guard.ts
      strategies/
        jwt.strategy.ts
      decorators/
        roles.decorator.ts
      auth.module.ts
      auth.service.ts
      auth.controller.ts
    metrics/                      # Metrics domain
      domain/
        entities/metric.entity.ts
        enums/
          metric-value-type.enum.ts
          metric-aggregation.enum.ts
        repositories/metric.repository.ts
        services/metric.service.ts
      application/
        dto/
          metric.dto.ts
          metric-list-item.dto.ts
        use-cases/metric.use-case.ts
      infrastructure/
        repositories/file-metric.repository.ts
      __tests__/
        metrics.controller.spec.ts
      metrics.module.ts
      metrics.controller.ts
    kpi/                          # KPI domain
      domain/
        entities/kpi.entity.ts
        repositories/kpi.repository.ts
        services/kpi.service.ts
      application/
        dto/kpi.dto.ts
        use-cases/kpi.use-case.ts
      infrastructure/
        repositories/file-kpi.repository.ts
      __tests__/
        kpi.controller.spec.ts
      kpi.module.ts
      kpi.controller.ts
    dashboards/                   # Dashboard domain
      domain/
        entities/dashboard.entity.ts
        repositories/dashboard.repository.ts
        services/dashboard.service.ts
      application/
        dto/dashboard.dto.ts
        use-cases/dashboard.use-case.ts
      infrastructure/
        repositories/file-dashboard.repository.ts
      __tests__/
        dashboard.controller.spec.ts
      dashboards.module.ts
      dashboards.controller.ts
    app.module.ts
    main.ts
  SPEC.md                         # This file
  README.md
  package.json
```

---

## Summary for AI Implementation

### Implementation Checklist

To implement the remaining features in order:

**Phase 1: Core Features** (High Priority)
- [ ] **Step 0**: Update root endpoint with API discovery (`app.controller.ts`)
- [ ] **Step 1**: Implement KPI domain (entity, repository, service, controller, tests)
  - [ ] Add `GET /kpis/by-metric/:metricUuid` endpoint
  - [ ] Update Metrics domain to include KPI links in responses
- [ ] **Step 2**: Implement Dashboard domain (entity, repository, service, controller, tests)
  - [ ] Add `GET /dashboards/:id/data` endpoint with date filtering
- [ ] **Step 3**: Add Authentication (AuthModule, JWT strategy, guards)
  - [ ] Configure in-memory user store with 3 test users
  - [ ] Optionally protect routes with `@UseGuards(JwtAuthGuard)`

**Phase 2: Enhanced Features** (Medium Priority)
- [ ] **Step 4**: Add validation rules to Metrics
  - [ ] Update Metric entity with `validationRules` field
  - [ ] Add validation logic in MetricService
- [ ] **Step 5**: Add CSV import/export for Metrics
  - [ ] Install `csv-parser` package
  - [ ] Implement `POST /metrics/:id/values/import`
  - [ ] Implement `GET /metrics/export`
- [ ] **Step 6**: Add metric value management
  - [ ] Implement `DELETE /metrics/:id/values` with date filtering

**Phase 3: Quality & Polish** (Before Production)
- [ ] Add class-validator decorators to all DTOs
- [ ] Enable global validation pipe in `main.ts`
- [ ] Write unit tests for all domain services
- [ ] Write e2e tests for all controllers
- [ ] Test authentication flow end-to-end
- [ ] Document environment variables in README

### Key Reminders

**Architecture**:
- ✅ Follow DDD structure religiously
- ✅ Keep domain logic in domain services
- ✅ Use cases orchestrate services and repositories
- ✅ Controllers handle HTTP only
- ✅ Repository pattern enables easy database migration

**API Design**:
- ✅ REST conventions (plural nouns, proper HTTP methods)
- ✅ Pagination for all list endpoints
- ✅ HATEOAS links in all responses
- ✅ ISO 8601 dates everywhere
- ✅ Consistent error responses

**UX/DX Priorities**:
1. **API Discovery**: Root endpoint helps developers explore the API
2. **KPI-Metric Links**: Bidirectional navigation enables intuitive UX
3. **Dashboard Data Endpoint**: Single-call optimization for front-end
4. **Simple Auth**: In-memory users for fast testing, easy migration later

### What Makes This Spec AI-Friendly?

1. **Complete Code Examples**: Every pattern includes copy-paste-ready TypeScript
2. **Explicit File Paths**: No ambiguity about where code should go
3. **Step-by-Step Instructions**: Implementation guidelines break down each task
4. **Existing Reference**: Metrics domain serves as a working template
5. **JSON Examples**: Clear API request/response formats
6. **Decision Rationale**: Explains "why" for each architectural choice
7. **Testing Templates**: Clear patterns for unit and e2e tests

This specification provides all the information needed to build a complete, production-ready API for metrics, KPIs, and dashboards. An AI or developer can follow this document sequentially to implement all features while maintaining architectural consistency and best practices.
