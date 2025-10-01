import { TileType } from '../enums/tile-type.enum';

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
    public ownerUuid: string,             // User UUID who owns this dashboard
    public tiles: TileConfig[],
    public readonly createdAt: string,    // ISO 8601
    public updatedAt: string,             // ISO 8601
  ) {}
}
