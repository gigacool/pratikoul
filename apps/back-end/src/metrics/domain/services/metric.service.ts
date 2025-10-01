import { MetricListItemDto } from '../../application/dto/metric-list-item.dto';
import { MetricValueDto } from '../../application/dto/metric.dto';
import { Injectable } from '@nestjs/common';
import { Metric } from '../entities/metric.entity';
import { MetricValueType } from '../enums/metric-value-type.enum';
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
          kpis: { href: `/kpis/by-metric/${metric.uuid}`, title: 'Related KPIs' },
        },
      };
    });
  }

  async getById(uuid: string): Promise<Metric | null> {
    return this.repository.findById(uuid);
  }

  async create(metric: Metric): Promise<void> {
    // Validate metric values against rules
    if (metric.validationRules) {
      metric.values.forEach(v => this.validateMetricValue(metric, v.value));
    }
    await this.repository.save(metric);
  }

  async update(uuid: string, metric: Partial<Metric>): Promise<void> {
    // If updating values and rules exist, validate
    const existing = await this.repository.findById(uuid);
    if (existing && existing.validationRules && metric.values) {
      metric.values.forEach(v => this.validateMetricValue(existing, v.value));
    }
    await this.repository.update(uuid, metric);
  }

  /**
   * Validate a metric value against validation rules
   */
  validateMetricValue(metric: Metric, value: number): void {
    if (!metric.validationRules) return;

    const rules = metric.validationRules;

    if (rules.min !== undefined && value < rules.min) {
      throw new Error(`Value ${value} is below minimum ${rules.min}`);
    }

    if (rules.max !== undefined && value > rules.max) {
      throw new Error(`Value ${value} exceeds maximum ${rules.max}`);
    }

    if (rules.allowNegative === false && value < 0) {
      throw new Error(`Negative values are not allowed for this metric`);
    }

    // Additional validation for valueType
    if (metric.valueType === MetricValueType.Percentage && (value < 0 || value > 100)) {
      throw new Error(`Percentage values must be between 0 and 100`);
    }
  }
}
