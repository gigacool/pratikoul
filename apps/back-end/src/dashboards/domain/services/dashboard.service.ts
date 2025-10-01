import { Injectable, NotFoundException } from '@nestjs/common';
import { Dashboard, TileConfig } from '../entities/dashboard.entity';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { DashboardListItemDto } from '../../application/dto/dashboard-list-item.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  /**
   * Returns a synthesized list of dashboards for the list resource
   */
  async getListItems(currentUserUuid?: string, isAdmin?: boolean): Promise<DashboardListItemDto[]> {
    const dashboards = await this.repository.findAll();
    return dashboards.map((dashboard) => ({
      uuid: dashboard.uuid,
      name: dashboard.name,
      description: dashboard.description,
      ownerUuid: dashboard.ownerUuid,
      tileCount: dashboard.tiles.length,
      updatedAt: dashboard.updatedAt,
      isOwner: isAdmin || dashboard.ownerUuid === currentUserUuid,
      _links: {
        self: { href: `/dashboards/${dashboard.uuid}` },
        data: { href: `/dashboards/${dashboard.uuid}/data` },
        duplicate: { href: `/dashboards/${dashboard.uuid}/duplicate` },
      },
    }));
  }

  /**
   * Duplicate a dashboard with a new owner
   */
  async duplicate(uuid: string, newOwnerUuid: string, namePrefix: string = 'Copy of'): Promise<Dashboard> {
    const original = await this.repository.findById(uuid);
    if (!original) {
      throw new NotFoundException(`Dashboard with uuid ${uuid} not found`);
    }

    const duplicate = new Dashboard(
      this.generateUuid(),
      `${namePrefix} ${original.name}`,
      original.description,
      newOwnerUuid,
      // Deep clone tiles to avoid reference issues
      JSON.parse(JSON.stringify(original.tiles)),
      new Date().toISOString(),
      new Date().toISOString(),
    );

    await this.repository.save(duplicate);
    return duplicate;
  }

  /**
   * Check if user can modify dashboard (owner or admin)
   */
  canModify(dashboard: Dashboard, userUuid: string, isAdmin: boolean): boolean {
    return isAdmin || dashboard.ownerUuid === userUuid;
  }

  private generateUuid(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getById(uuid: string): Promise<Dashboard | null> {
    return this.repository.findById(uuid);
  }

  async create(dashboard: Dashboard): Promise<void> {
    // Validate tiles
    this.validateTiles(dashboard.tiles);
    await this.repository.save(dashboard);
  }

  async update(uuid: string, dashboard: Partial<Dashboard>): Promise<void> {
    if (dashboard.tiles) {
      this.validateTiles(dashboard.tiles);
    }
    await this.repository.update(uuid, dashboard);
  }

  async delete(uuid: string): Promise<void> {
    await this.repository.delete(uuid);
  }

  /**
   * Get all unique metric UUIDs from dashboard tiles
   */
  extractMetricUuids(dashboard: Dashboard): string[] {
    const uuids = new Set<string>();
    dashboard.tiles.forEach((tile) => {
      tile.metricUuids.forEach((uuid) => uuids.add(uuid));
    });
    return Array.from(uuids);
  }

  /**
   * Get all unique KPI UUIDs from dashboard tiles
   */
  extractKpiUuids(dashboard: Dashboard): string[] {
    const uuids = new Set<string>();
    dashboard.tiles.forEach((tile) => {
      if (tile.kpiUuids) {
        tile.kpiUuids.forEach((uuid) => uuids.add(uuid));
      }
    });
    return Array.from(uuids);
  }

  /**
   * Validate tile structure and uniqueness
   */
  private validateTiles(tiles: TileConfig[]): void {
    if (tiles.length === 0) {
      throw new Error('Dashboard must have at least one tile');
    }

    // Check for unique tile IDs
    const ids = new Set<string>();
    for (const tile of tiles) {
      if (ids.has(tile.id)) {
        throw new Error(`Duplicate tile ID: ${tile.id}`);
      }
      ids.add(tile.id);

      // Validate grid positions
      if (tile.x < 0 || tile.y < 0 || tile.w <= 0 || tile.h <= 0) {
        throw new Error(`Invalid tile dimensions for tile ${tile.id}`);
      }

      // Validate that tile has at least one metric
      if (!tile.metricUuids || tile.metricUuids.length === 0) {
        throw new Error(`Tile ${tile.id} must reference at least one metric`);
      }
    }

    // Optional: Check for overlapping tiles (simplified)
    // In production, you might want more sophisticated overlap detection
    this.checkTileOverlaps(tiles);
  }

  /**
   * Check for overlapping tiles (simplified check)
   */
  private checkTileOverlaps(tiles: TileConfig[]): void {
    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        const tile1 = tiles[i];
        const tile2 = tiles[j];

        // Check if rectangles overlap
        const overlap =
          tile1.x < tile2.x + tile2.w &&
          tile1.x + tile1.w > tile2.x &&
          tile1.y < tile2.y + tile2.h &&
          tile1.y + tile1.h > tile2.y;

        if (overlap) {
          throw new Error(
            `Tiles ${tile1.id} and ${tile2.id} overlap. Please adjust positions.`
          );
        }
      }
    }
  }
}
