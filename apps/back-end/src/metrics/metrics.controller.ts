import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { MetricUseCase } from './application/use-cases/metric.use-case';
import { MetricDto } from './application/dto/metric.dto';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly useCase: MetricUseCase) { }

  @Get()
  async getAll() {
    return this.useCase.getAll();
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
