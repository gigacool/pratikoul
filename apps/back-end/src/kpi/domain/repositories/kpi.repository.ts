import { Kpi } from '../entities/kpi.entity';

export abstract class KpiRepository {
  abstract findAll(): Promise<Kpi[]>;
  abstract findById(uuid: string): Promise<Kpi | null>;
  abstract findByMetricUuid(metricUuid: string): Promise<Kpi[]>;
  abstract save(kpi: Kpi): Promise<void>;
  abstract update(uuid: string, kpi: Partial<Kpi>): Promise<void>;
  abstract delete(uuid: string): Promise<void>;
}
