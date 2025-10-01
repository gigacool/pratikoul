import { Body, Controller, Get, Param, Post, Put, Delete, Query, NotFoundException } from '@nestjs/common';
import { KpiUseCase } from './application/use-cases/kpi.use-case';
import { KpiDto } from './application/dto/kpi.dto';
import { KpiListItemDto } from './application/dto/kpi-list-item.dto';

@Controller('kpis')
export class KpisController {
  constructor(private readonly useCase: KpiUseCase) {}

  /**
   * Returns a paginated synthesized list of KPIs
   */
  @Get()
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ): Promise<{
    items: KpiListItemDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    return this.useCase.getListItemsPaginated(pageNum, limitNum, status);
  }

  @Get('by-metric/:metricUuid')
  async getByMetricUuid(@Param('metricUuid') metricUuid: string) {
    return this.useCase.getByMetricUuid(metricUuid);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const kpi = await this.useCase.getById(id);
    if (!kpi) {
      throw new NotFoundException(`KPI with ID ${id} not found`);
    }
    return kpi;
  }

  @Post()
  async create(@Body() dto: KpiDto) {
    await this.useCase.create(dto);
    return { status: 'created' };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<KpiDto>) {
    await this.useCase.update(id, dto);
    return { status: 'updated' };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.useCase.delete(id);
    return { status: 'deleted' };
  }
}
