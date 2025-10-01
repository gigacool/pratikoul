import { KpiStatus } from '../../domain/enums/kpi-status.enum';

export class KpiListItemDto {
  uuid: string;
  name: string;
  description: string;
  metricUuid: string;
  status: KpiStatus;
  currentTarget?: number;  // Most relevant target based on current date
  _links: {
    self: { href: string };
    metric: { href: string; title: string };
  };
}
