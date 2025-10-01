import { MetricListItemDto } from '../../application/dto/metric-list-item.dto';
import { MetricValueDto } from '../../application/dto/metric.dto';
import { Injectable } from '@nestjs/common';
import { Metric } from '../entities/metric.entity';
import { MetricRepository } from '../repositories/metric.repository';

function getLatestValue(values: MetricValueDto[]): MetricValueDto | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((latest, current) => {
    return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
  });
}

@Injectable()
export class MetricService {
  constructor(private readonly repository: MetricRepository) {}

  /**
   * Returns a synthesized list of metrics for the list resource (uuid, name, description, HATEOAS link)
   */
  async getListItems(): Promise<MetricListItemDto[]> {
    const metrics = await this.repository.findAll();
    return metrics.map((metric) => {
      const latest = getLatestValue(metric.values);
      return {
        uuid: metric.uuid,
        name: metric.name,
        lastTimestamp: latest ? latest.timestamp : undefined,
        lastValue: latest ? latest.value : undefined,
        description: metric.description,
        _links: {
          self: { href: `/metrics/${metric.uuid}` },
        },
      };
    });
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
