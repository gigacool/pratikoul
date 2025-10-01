import { Injectable } from '@nestjs/common';
import { Kpi } from '../entities/kpi.entity';
import { KpiRepository } from '../repositories/kpi.repository';
import { KpiListItemDto } from '../../application/dto/kpi-list-item.dto';

@Injectable()
export class KpiService {
  constructor(private readonly repository: KpiRepository) {}

  /**
   * Returns a synthesized list of KPIs for the list resource
   */
  async getListItems(): Promise<KpiListItemDto[]> {
    const kpis = await this.repository.findAll();
    return kpis.map((kpi) => ({
      uuid: kpi.uuid,
      name: kpi.name,
      description: kpi.description,
      metricUuid: kpi.metricUuid,
      status: kpi.status,
      currentTarget: this.calculateCurrentTarget(kpi, new Date()),
      _links: {
        self: { href: `/kpis/${kpi.uuid}` },
        metric: { href: `/metrics/${kpi.metricUuid}`, title: 'Related Metric' },
      },
    }));
  }

  async getById(uuid: string): Promise<Kpi | null> {
    return this.repository.findById(uuid);
  }

  async getByMetricUuid(metricUuid: string): Promise<Kpi[]> {
    return this.repository.findByMetricUuid(metricUuid);
  }

  async create(kpi: Kpi): Promise<void> {
    // Validate targets
    this.validateTargets(kpi.targets);
    await this.repository.save(kpi);
  }

  async update(uuid: string, kpi: Partial<Kpi>): Promise<void> {
    if (kpi.targets) {
      this.validateTargets(kpi.targets);
    }
    await this.repository.update(uuid, kpi);
  }

  async delete(uuid: string): Promise<void> {
    // Soft delete: set status to archived
    await this.repository.update(uuid, { status: 'archived' as any });
  }

  /**
   * Calculate the most relevant target based on current date
   */
  calculateCurrentTarget(kpi: Kpi, currentDate: Date): number | undefined {
    if (kpi.targets.length === 0) return undefined;

    // If targets have dates, find the most relevant one
    const datedTargets = kpi.targets.filter((t) => t.date);
    if (datedTargets.length > 0) {
      // Find the closest future target or most recent past target
      const sorted = [...datedTargets].sort(
        (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
      );

      // Find first future target
      const futureTarget = sorted.find(
        (t) => new Date(t.date!).getTime() >= currentDate.getTime()
      );

      if (futureTarget) return futureTarget.value;

      // If no future targets, return the most recent past target
      return sorted[sorted.length - 1].value;
    }

    // If no dated targets, return the first target (static)
    return kpi.targets[0].value;
  }

  /**
   * Evaluate KPI status against current metric value
   */
  evaluateStatus(
    kpi: Kpi,
    currentMetricValue: number
  ): 'on-track' | 'warning' | 'critical' {
    if (!kpi.thresholds) return 'on-track';

    if (
      kpi.thresholds.critical !== undefined &&
      currentMetricValue < kpi.thresholds.critical
    ) {
      return 'critical';
    }

    if (
      kpi.thresholds.warning !== undefined &&
      currentMetricValue < kpi.thresholds.warning
    ) {
      return 'warning';
    }

    return 'on-track';
  }

  /**
   * Validate target structure
   */
  private validateTargets(targets: any[]): void {
    if (targets.length === 0) {
      throw new Error('At least one target is required');
    }

    // Check chronological order for dated targets
    const datedTargets = targets.filter((t) => t.date);
    if (datedTargets.length > 1) {
      for (let i = 1; i < datedTargets.length; i++) {
        if (
          new Date(datedTargets[i].date).getTime() <=
          new Date(datedTargets[i - 1].date).getTime()
        ) {
          throw new Error('Targets with dates must be in chronological order');
        }
      }
    }
  }
}
