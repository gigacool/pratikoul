import { Dashboard } from '../entities/dashboard.entity';

export abstract class DashboardRepository {
  abstract findAll(): Promise<Dashboard[]>;
  abstract findById(uuid: string): Promise<Dashboard | null>;
  abstract save(dashboard: Dashboard): Promise<void>;
  abstract update(uuid: string, dashboard: Partial<Dashboard>): Promise<void>;
  abstract delete(uuid: string): Promise<void>;
}
