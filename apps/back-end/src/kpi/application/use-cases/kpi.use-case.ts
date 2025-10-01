import { Injectable } from '@nestjs/common';
import { KpiService } from '../../domain/services/kpi.service';
import { KpiDto } from '../dto/kpi.dto';
import { Kpi } from '../../domain/entities/kpi.entity';
import { KpiListItemDto } from '../dto/kpi-list-item.dto';
import { uuidv4 } from 'libs/shared/uuid';

export interface PaginatedKpiList {
  items: KpiListItemDto[];
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
export class KpiUseCase {
  constructor(private readonly kpiService: KpiService) {}

  /**
   * Returns a paginated synthesized list of KPIs
   */
  async getListItemsPaginated(
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<PaginatedKpiList> {
    let all = await this.kpiService.getListItems();

    // Filter by status if provided
    if (status) {
      all = all.filter((k) => k.status === status);
    }

    const total = all.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = all.slice(start, end);

    // Calculate last page
    const lastPage = Math.max(1, Math.ceil(total / limit));

    // Helper to build link
    const buildLink = (p: number) => {
      const statusParam = status ? `&status=${status}` : '';
      return `/kpis?page=${p}&limit=${limit}${statusParam}`;
    };

    const _links: PaginatedKpiList['_links'] = {
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

  async getById(uuid: string): Promise<Kpi | null> {
    return this.kpiService.getById(uuid);
  }

  async getByMetricUuid(metricUuid: string): Promise<{
    metricUuid: string;
    kpis: Kpi[];
    _links: {
      metric: { href: string };
    };
  }> {
    const kpis = await this.kpiService.getByMetricUuid(metricUuid);
    return {
      metricUuid,
      kpis,
      _links: {
        metric: { href: `/metrics/${metricUuid}` },
      },
    };
  }

  async create(dto: KpiDto): Promise<void> {
    const now = new Date().toISOString();
    const kpi = new Kpi(
      uuidv4(),
      dto.name,
      dto.description,
      dto.metricUuid,
      dto.targets,
      dto.status,
      dto.thresholds,
      now,
      now,
    );
    await this.kpiService.create(kpi);
  }

  async update(uuid: string, dto: Partial<KpiDto>): Promise<void> {
    const updateData: any = { ...dto };
    if (dto.name || dto.description || dto.targets || dto.thresholds) {
      updateData.updatedAt = new Date().toISOString();
    }
    await this.kpiService.update(uuid, updateData);
  }

  async delete(uuid: string): Promise<void> {
    await this.kpiService.delete(uuid);
  }
}
