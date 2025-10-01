import { IsString, IsEnum, IsArray, IsOptional, IsNumber, ValidateNested, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { MetricValueType } from '../../domain/enums/metric-value-type.enum';
import { MetricAggregation } from '../../domain/enums/metric-aggregation.enum';

export class MetricValueDto {
  @IsNumber()
  value: number;

  @IsString()
  timestamp: string;
}

export class MetricValidationRulesDto {
  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;

  @IsOptional()
  @IsBoolean()
  allowNegative?: boolean;

  @IsOptional()
  @IsString()
  requiredFrequency?: 'daily' | 'weekly' | 'monthly';
}

export class MetricDto {
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(MetricValueType)
  valueType: MetricValueType;

  @IsString()
  unit: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricValueDto)
  values: MetricValueDto[];

  @IsEnum(MetricAggregation)
  aggregation: MetricAggregation;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => MetricValidationRulesDto)
  validationRules?: MetricValidationRulesDto;
}
