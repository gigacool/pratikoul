import { MetricValueType } from '../../domain/enums/metric-value-type.enum';
import { MetricAggregation } from '../../domain/enums/metric-aggregation.enum';

export class MetricValueDto {
  value: number;
  timestamp: string;
}

export class MetricDto {
  uuid?: string;
  name: string;
  description: string;
  valueType: MetricValueType;
  unit: string;
  values: MetricValueDto[];
  aggregation: MetricAggregation;
  tags: string[];
}
