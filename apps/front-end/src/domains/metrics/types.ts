export interface MetricListItem {
  uuid: string;
  name: string;
  description: string;
  _links: { self: { href: string } };
}

export interface MetricListProps {
  metrics: MetricListItem[];
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number, limit: number) => void;
  onSelect: (uuid: string) => void;
  selectedUuid?: string | null;
  onAdd?: () => void;
}