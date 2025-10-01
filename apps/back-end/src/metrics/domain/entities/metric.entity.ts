import { MetricValueType } from '../enums/metric-value-type.enum';
import { MetricAggregation } from '../enums/metric-aggregation.enum';

export interface MetricValue {
  value: number;
  timestamp: string; // ISO string
}

export interface MetricValidationRules {
  min?: number;                    // Minimum allowed value
  max?: number;                    // Maximum allowed value
  allowNegative?: boolean;         // Allow negative values (default: true)
  requiredFrequency?: 'daily' | 'weekly' | 'monthly';  // Expected data frequency
}

export class Metric {
  constructor(
    public readonly uuid: string,
    public name: string,
    public description: string,
    public valueType: MetricValueType,
    public unit: string,
    public values: MetricValue[],
    public aggregation: MetricAggregation,
    public tags: string[],
    public validationRules?: MetricValidationRules,
  ) {}
}
