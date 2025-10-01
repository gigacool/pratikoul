export class MetricListItemDto {
  uuid: string;
  name: string;
  lastTimestamp: string | undefined; // ISO 8601 date string (YYYY-MM-DD)
  lastValue: number | undefined;
  description: string;
  _links: {
    self: { href: string };
  };
}
