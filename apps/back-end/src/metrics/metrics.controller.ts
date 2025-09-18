import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { MetricUseCase } from './application/use-cases/metric.use-case';
import { MetricDto } from './application/dto/metric.dto';
import { MetricListItemDto } from './application/dto/metric-list-item.dto';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly useCase: MetricUseCase) {}

  /**
   * Returns a paginated synthesized list of metrics for the list resource (uuid, name, description, HATEOAS link)
   */
  @Get()
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<{
    items: MetricListItemDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    return this.useCase.getListItemsPaginated(pageNum, limitNum);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.useCase.getById(id);
  }

  @Post()
  async create(@Body() dto: MetricDto) {
    await this.useCase.create(dto);
    return { status: 'created' };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<MetricDto>) {
    await this.useCase.update(id, dto);
    return { status: 'updated' };
  }
}
