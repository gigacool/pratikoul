import { Metric } from '../entities/metric.entity';

export abstract class MetricRepository {
  abstract findAll(): Promise<Metric[]>;
  abstract findById(uuid: string): Promise<Metric | null>;
  abstract save(metric: Metric): Promise<void>;
  abstract update(uuid: string, metric: Partial<Metric>): Promise<void>;
}
