import React from 'react';
import { Row, Col, message } from 'antd';
import { MetricList, type MetricListItem } from '../domains/metrics/components/MetricList';
import { MetricDetail } from '../domains/metrics/components/MetricDetail';

interface PaginatedMetricList {
  items: MetricListItem[];
  total: number;
  page: number;
  limit: number;
  _links: object;
}

interface MetricDetailType extends MetricListItem {
  valueType: string;
  unit: string;
  values: Array<{ value: number; timestamp: string }>;
  aggregation: string;
  tags: string[];
}

export function MetricsPage() {
  const [metrics, setMetrics] = React.useState<MetricListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(5);
  const [loading, setLoading] = React.useState(false);
  const [selectedMetric, setSelectedMetric] = React.useState<MetricDetailType | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);


  const fetchMetrics = async (pageNum = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metrics?page=${pageNum}&limit=${pageSize}`);
      const data: PaginatedMetricList = await res.json();
      setMetrics(data.items);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
    } catch {
      message.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricDetail = async (uuid: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/metrics/${uuid}`);
      const data: MetricDetailType = await res.json();
      setSelectedMetric(data);
    } catch {
      message.error('Failed to fetch metric details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Add Metric handler (moved to top level)
  const handleAddMetric = async () => {
    const newMetric = {
      name: 'New Metric',
      description: '',
      valueType: 'integer',
      unit: '',
      values: [],
      aggregation: 'sum',
      tags: [],
    };
    try {
      const res = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMetric),
      });
      if (!res.ok) throw new Error('Failed to create metric');
      await fetchMetrics(page, limit);
      const latest = metrics.find(m => m.name === 'New Metric' && m.description === '');
      if (latest) fetchMetricDetail(latest.uuid);
      else setSelectedMetric(null);
    } catch {
      message.error('Failed to create metric');
    }
  };

  React.useEffect(() => {
    fetchMetrics(page, limit);
  }, [page, limit]);

  return (
    <Row gutter={24} style={{ minHeight: '100vh', padding: 24 }}>
      <Col span={10}>
        <MetricList
          metrics={metrics}
          loading={loading}
          page={page}
          limit={limit}
          total={total}
          onPageChange={(p, l) => {
            setPage(p);
            setLimit(l);
          }}
          onSelect={fetchMetricDetail}
          selectedUuid={selectedMetric?.uuid}
          onAdd={handleAddMetric}
        />
      </Col>
      <Col span={14}>
        <MetricDetail selectedMetric={selectedMetric} loading={detailLoading} />
      </Col>
    </Row>
  );
}
