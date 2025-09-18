import { MetricListItemDto } from '../dto/metric-list-item.dto';
export interface PaginatedMetricList {
  items: MetricListItemDto[];
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
import { Injectable } from '@nestjs/common';
import { MetricService } from '../../domain/services/metric.service';
import { MetricDto } from '../dto/metric.dto';
import { Metric } from '../../domain/entities/metric.entity';
import { uuidv4 } from 'libs/shared/uuid';

@Injectable()
export class MetricUseCase {
  constructor(private readonly metricService: MetricService) {}

  /**
   * Returns a paginated synthesized list of metrics for the list resource (uuid, name, description, HATEOAS link)
   */
  async getListItemsPaginated(
    page = 1,
    limit = 10,
  ): Promise<PaginatedMetricList> {
    const all = await this.metricService.getListItems();
    const total = all.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = all.slice(start, end);

    // Calculate last page
    const lastPage = Math.max(1, Math.ceil(total / limit));
    // Helper to build link
    const buildLink = (p: number) => `/metrics?page=${p}&limit=${limit}`;
    const _links: PaginatedMetricList['_links'] = {
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

  async getById(uuid: string): Promise<Metric | null> {
    return this.metricService.getById(uuid);
  }

  async create(dto: MetricDto): Promise<void> {
    const metric = new Metric(
      uuidv4(),
      dto.name,
      dto.description,
      dto.valueType,
      dto.unit,
      dto.values,
      dto.aggregation,
      dto.tags,
    );
    await this.metricService.create(metric);
  }

  async update(uuid: string, dto: Partial<MetricDto>): Promise<void> {
    await this.metricService.update(uuid, dto);
  }
}
