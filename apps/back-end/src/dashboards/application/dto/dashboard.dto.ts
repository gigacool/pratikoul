import { IsString, IsArray, IsBoolean, IsOptional, IsNumber, IsEnum, ValidateNested, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TileType } from '../../domain/enums/tile-type.enum';

export class TileConfigDto {
  @IsString()
  id: string;

  @IsNumber()
  @Min(0)
  x: number;

  @IsNumber()
  @Min(0)
  y: number;

  @IsNumber()
  @Min(1)
  w: number;

  @IsNumber()
  @Min(1)
  h: number;

  @IsEnum(TileType)
  type: TileType;

  @IsArray()
  @IsUUID('4', { each: true })
  metricUuids: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  kpiUuids?: string[];

  @IsOptional()
  config?: Record<string, any>;
}

export class DashboardDto {
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  ownerUuid?: string;  // Set automatically from JWT on create, optional on update

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TileConfigDto)
  tiles: TileConfigDto[];
}
