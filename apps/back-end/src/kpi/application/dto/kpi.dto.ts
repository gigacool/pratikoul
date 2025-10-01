import { IsString, IsEnum, IsArray, IsOptional, IsNumber, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { KpiStatus } from '../../domain/enums/kpi-status.enum';

export class KpiTargetDto {
  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class KpiThresholdsDto {
  @IsOptional()
  @IsNumber()
  warning?: number;

  @IsOptional()
  @IsNumber()
  critical?: number;
}

export class KpiDto {
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsUUID()
  metricUuid: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KpiTargetDto)
  targets: KpiTargetDto[];

  @IsEnum(KpiStatus)
  status: KpiStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => KpiThresholdsDto)
  thresholds?: KpiThresholdsDto;
}
