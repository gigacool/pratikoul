import { Injectable } from '@nestjs/common';
import { MetricService } from '../../domain/services/metric.service';
import { MetricDto } from '../dto/metric.dto';
import { Metric } from '../../domain/entities/metric.entity';
import { uuidv4 } from 'libs/shared/uuid';

@Injectable()
export class MetricUseCase {
  constructor(private readonly metricService: MetricService) {}

  async getAll(): Promise<Metric[]> {
    return this.metricService.getAll();
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
