import { Module } from '@nestjs/common';
import { KpiService } from './domain/services/kpi.service';
import { FileKpiRepository } from './infrastructure/repositories/file-kpi.repository';
import { KpiRepository } from './domain/repositories/kpi.repository';
import { KpiUseCase } from './application/use-cases/kpi.use-case';
import { KpisController } from './kpi.controller';

@Module({
  providers: [
    KpiService,
    KpiUseCase,
    {
      provide: KpiRepository,
      useClass: FileKpiRepository,
    },
  ],
  controllers: [KpisController],
  exports: [KpiRepository, KpiService], // Export for use in other modules
})
export class KpiModule {}
