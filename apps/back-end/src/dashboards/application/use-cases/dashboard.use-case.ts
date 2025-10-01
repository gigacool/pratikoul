import { Injectable, NotFoundException } from '@nestjs/common';
import { DashboardService } from '../../domain/services/dashboard.service';
import { DashboardDto } from '../dto/dashboard.dto';
import { Dashboard } from '../../domain/entities/dashboard.entity';
import { DashboardListItemDto } from '../dto/dashboard-list-item.dto';
import { uuidv4 } from 'libs/shared/uuid';

export interface PaginatedDashboardList {
  items: DashboardListItemDto[];
  total: number;
  page: number;
  limit: number;
  _links: {
    first: { href: string };
    prev?: { href: string };
    next?: { href: string };
    last: { href: string };
  };
}

@Injectable()
export class DashboardUseCase {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  /**
   * Returns a paginated synthesized list of dashboards
   */
  async getListItemsPaginated(
    page = 1,
    limit = 10,
    currentUserUuid?: string,
    isAdmin?: boolean,
  ): Promise<PaginatedDashboardList> {
    const all = await this.dashboardService.getListItems(currentUserUuid, isAdmin);
    const total = all.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = all.slice(start, end);

    // Calculate last page
    const lastPage = Math.max(1, Math.ceil(total / limit));

    // Helper to build link
    const buildLink = (p: number) => `/dashboards?page=${p}&limit=${limit}`;

    const _links: PaginatedDashboardList['_links'] = {
      first: { href: buildLink(1) },
      last: { href: buildLink(lastPage) },
    };

    if (page > 1) {
      _links.prev = { href: buildLink(page - 1) };
    }
    if (page < lastPage) {
      _links.next = { href: buildLink(page + 1) };
    }

    return { items, total, page, limit, _links };
  }

  async getById(uuid: string): Promise<Dashboard | null> {
    return this.dashboardService.getById(uuid);
  }

  async create(dto: DashboardDto): Promise<Dashboard> {
    const now = new Date().toISOString();
    const dashboard = new Dashboard(
      uuidv4(),
      dto.name,
      dto.description,
      dto.ownerUuid,
      dto.tiles,
      now,
      now,
    );
    await this.dashboardService.create(dashboard);
    return dashboard;
  }

  async duplicate(uuid: string, newOwnerUuid: string): Promise<Dashboard> {
    return this.dashboardService.duplicate(uuid, newOwnerUuid);
  }

  async update(uuid: string, dto: Partial<DashboardDto>): Promise<void> {
    const updateData: any = { ...dto };
    if (dto.name || dto.description || dto.tiles) {
      updateData.updatedAt = new Date().toISOString();
    }
    await this.dashboardService.update(uuid, updateData);
  }

  async delete(uuid: string): Promise<void> {
    await this.dashboardService.delete(uuid);
  }

  /**
   * Get metric UUIDs from dashboard
   */
  getMetricUuids(dashboard: Dashboard): string[] {
    return this.dashboardService.extractMetricUuids(dashboard);
  }

  /**
   * Get KPI UUIDs from dashboard
   */
  getKpiUuids(dashboard: Dashboard): string[] {
    return this.dashboardService.extractKpiUuids(dashboard);
  }
}
