export class MetricListItemDto {
  uuid: string;
  name: string;
  description: string;
  _links: {
    self: { href: string };
  };
}
