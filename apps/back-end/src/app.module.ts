import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

import { MetricsModule } from './metrics/metrics.module';
import { KpiModule } from './kpi/kpi.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [MetricsModule, KpiModule, DashboardsModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
