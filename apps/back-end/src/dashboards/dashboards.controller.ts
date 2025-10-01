import { Body, Controller, Get, Param, Post, Put, Delete, Query, NotFoundException, Inject, UseGuards, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardUseCase } from './application/use-cases/dashboard.use-case';
import { DashboardDto } from './application/dto/dashboard.dto';
import { DashboardListItemDto } from './application/dto/dashboard-list-item.dto';
import { MetricRepository } from '../metrics/domain/repositories/metric.repository';
import { KpiRepository } from '../kpi/domain/repositories/kpi.repository';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/domain/enums/user-role.enum';

@Controller('dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(
    private readonly useCase: DashboardUseCase,
    @Inject(MetricRepository) private readonly metricRepository: MetricRepository,
    @Inject(KpiRepository) private readonly kpiRepository: KpiRepository,
  ) {}

  /**
   * Returns a paginated synthesized list of dashboards
   */
  @Get()
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() currentUser: any,
  ): Promise<{
    items: DashboardListItemDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const isAdmin = currentUser.role === UserRole.ADMIN;
    return this.useCase.getListItemsPaginated(pageNum, limitNum, currentUser.userId, isAdmin);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const dashboard = await this.useCase.getById(id);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }
    return dashboard;
  }

  /**
   * Special endpoint: Get dashboard with all metric and KPI data
   * Supports date filtering via query parameters
   */
  @Get(':id/data')
  async getDashboardData(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dashboard = await this.useCase.getById(id);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }

    // Extract unique metric and KPI UUIDs
    const metricUuids = this.useCase.getMetricUuids(dashboard);
    const kpiUuids = this.useCase.getKpiUuids(dashboard);

    // Fetch all metrics
    const metricsData: Record<string, any> = {};
    for (const uuid of metricUuids) {
      const metric = await this.metricRepository.findById(uuid);
      if (metric) {
        // Filter values by date range if provided
        let filteredValues = metric.values;
        if (startDate || endDate) {
          filteredValues = metric.values.filter((v) => {
            const valueDate = new Date(v.timestamp);
            const isAfterStart = !startDate || valueDate >= new Date(startDate);
            const isBeforeEnd = !endDate || valueDate <= new Date(endDate);
            return isAfterStart && isBeforeEnd;
          });
        }

        metricsData[uuid] = {
          uuid: metric.uuid,
          name: metric.name,
          description: metric.description,
          unit: metric.unit,
          valueType: metric.valueType,
          values: filteredValues,
        };
      }
    }

    // Fetch all KPIs
    const kpisData: Record<string, any> = {};
    for (const uuid of kpiUuids) {
      const kpi = await this.kpiRepository.findById(uuid);
      if (kpi) {
        kpisData[uuid] = {
          uuid: kpi.uuid,
          name: kpi.name,
          description: kpi.description,
          metricUuid: kpi.metricUuid,
          targets: kpi.targets,
          thresholds: kpi.thresholds,
          status: kpi.status,
        };
      }
    }

    return {
      dashboard: {
        uuid: dashboard.uuid,
        name: dashboard.name,
        description: dashboard.description,
        tiles: dashboard.tiles,
      },
      data: {
        metrics: metricsData,
        kpis: kpisData,
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: DashboardDto, @CurrentUser() currentUser: any) {
    // Set owner from current user
    dto.ownerUuid = currentUser.userId;
    const dashboard = await this.useCase.create(dto);
    return dashboard;
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  async duplicate(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const dashboard = await this.useCase.duplicate(id, currentUser.userId);
    return dashboard;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<DashboardDto>, @CurrentUser() currentUser: any) {
    const dashboard = await this.useCase.getById(id);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }

    // Check ownership
    const isAdmin = currentUser.role === UserRole.ADMIN;
    if (!isAdmin && dashboard.ownerUuid !== currentUser.userId) {
      throw new ForbiddenException('You can only edit your own dashboards');
    }

    await this.useCase.update(id, dto);
    return { status: 'updated' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const dashboard = await this.useCase.getById(id);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }

    // Check ownership
    const isAdmin = currentUser.role === UserRole.ADMIN;
    if (!isAdmin && dashboard.ownerUuid !== currentUser.userId) {
      throw new ForbiddenException('You can only delete your own dashboards');
    }

    await this.useCase.delete(id);
  }
}
