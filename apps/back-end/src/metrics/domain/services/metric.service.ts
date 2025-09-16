import { Injectable } from '@nestjs/common';
import { Metric } from '../entities/metric.entity';
import { MetricRepository } from '../repositories/metric.repository';

@Injectable()
export class MetricService {
  constructor(private readonly repository: MetricRepository) {}

  async getAll(): Promise<Metric[]> {
    return this.repository.findAll();
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
