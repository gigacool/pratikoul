import { KpiStatus } from '../enums/kpi-status.enum';

export interface KpiTarget {
  value: number;          // Target value
  date?: string;          // Optional: ISO 8601 date for time-driven targets
  label?: string;         // Optional: Human-readable label (e.g., "Q1 Target")
}

export interface KpiThresholds {
  warning?: number;       // Warning threshold value
  critical?: number;      // Critical threshold value
}

export class Kpi {
  constructor(
    public readonly uuid: string,
    public name: string,
    public description: string,
    public metricUuid: string,           // Reference to parent metric
    public targets: KpiTarget[],         // Flexible: static or time-driven
    public status: KpiStatus,
    public thresholds: KpiThresholds | undefined,   // Optional alert thresholds
    public readonly createdAt: string,   // ISO 8601
    public updatedAt: string,            // ISO 8601
  ) {}
}
