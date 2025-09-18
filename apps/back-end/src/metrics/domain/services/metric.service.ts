import { MetricListItemDto } from '../../application/dto/metric-list-item.dto';
import { Injectable } from '@nestjs/common';
import { Metric } from '../entities/metric.entity';
import { MetricRepository } from '../repositories/metric.repository';

@Injectable()
export class MetricService {
  constructor(private readonly repository: MetricRepository) {}

  /**
   * Returns a synthesized list of metrics for the list resource (uuid, name, description, HATEOAS link)
   */
  async getListItems(): Promise<MetricListItemDto[]> {
    const metrics = await this.repository.findAll();
    return metrics.map((metric) => ({
      uuid: metric.uuid,
      name: metric.name,
      description: metric.description,
      _links: {
        self: { href: `/metrics/${metric.uuid}` },
      },
    }));
  }

  async getById(uuid: string): Promise<Metric | null> {
    return this.repository.findById(uuid);
  }

  async create(metric: Metric): Promise<void> {
    await this.repository.save(metric);
  }

  async update(uuid: string, metric: Partial<Metric>): Promise<void> {
    await this.repository.update(uuid, metric);
  }
}
