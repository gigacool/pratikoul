import { Module } from '@nestjs/common';
import { MetricService } from './domain/services/metric.service';
import { FileMetricRepository } from './infrastructure/repositories/file-metric.repository';
import { MetricRepository } from './domain/repositories/metric.repository';
import { MetricUseCase } from './application/use-cases/metric.use-case';
import { MetricsController } from './metrics.controller';

@Module({
  providers: [
    MetricService,
    MetricUseCase,
    {
      provide: MetricRepository,
      useClass: FileMetricRepository,
    },
  ],
  controllers: [MetricsController],
  exports: [MetricRepository, MetricService],
})
export class MetricsModule {}
