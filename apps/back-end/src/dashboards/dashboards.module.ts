import { Module } from '@nestjs/common';
import { DashboardService } from './domain/services/dashboard.service';
import { FileDashboardRepository } from './infrastructure/repositories/file-dashboard.repository';
import { DashboardRepository } from './domain/repositories/dashboard.repository';
import { DashboardUseCase } from './application/use-cases/dashboard.use-case';
import { DashboardsController } from './dashboards.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { KpiModule } from '../kpi/kpi.module';

@Module({
  imports: [MetricsModule, KpiModule],
  providers: [
    DashboardService,
    DashboardUseCase,
    {
      provide: DashboardRepository,
      useClass: FileDashboardRepository,
    },
  ],
  controllers: [DashboardsController],
  exports: [DashboardService],
})
export class DashboardsModule {}
