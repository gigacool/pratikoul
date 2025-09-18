import React, { useEffect, useState } from 'react';
import { Table, Pagination, Card, Row, Col, Spin, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface MetricListItem {
  uuid: string;
  name: string;
  description: string;
  _links: { self: { href: string } };
}

interface PaginatedMetricList {
  items: MetricListItem[];
  total: number;
  page: number;
  limit: number;
  _links: object;
}

interface MetricDetail extends MetricListItem {
  valueType: string;
  unit: string;
  values: Array<{ value: number; timestamp: string }>;
  aggregation: string;
  tags: string[];
}

export function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchMetrics = async (pageNum = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metrics?page=${pageNum}&limit=${pageSize}`);
      const data: PaginatedMetricList = await res.json();
      setMetrics(data.items);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
    } catch (e) {
      message.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricDetail = async (uuid: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/metrics/${uuid}`);
      const data: MetricDetail = await res.json();
      setSelectedMetric(data);
    } catch (e) {
      message.error('Failed to fetch metric details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(page, limit);
  }, [page, limit]);

  const columns: ColumnsType<MetricListItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <Row gutter={24} style={{ minHeight: '100vh', padding: 24 }}>
      <Col span={10}>
        <Card title={<Title level={4}>Metrics</Title>}>
          <Table
            rowKey="uuid"
            columns={columns}
            dataSource={metrics}
            loading={loading}
            pagination={false}
            onRow={record => ({
              onClick: () => fetchMetricDetail(record.uuid),
              style: { cursor: 'pointer' },
            })}
            rowClassName={record => (selectedMetric?.uuid === record.uuid ? 'ant-table-row-selected' : '')}
          />
          <Pagination
            style={{ marginTop: 16, textAlign: 'right' }}
            current={page}
            pageSize={limit}
            total={total}
            onChange={(p, l) => {
              setPage(p);
              setLimit(l);
            }}
            showSizeChanger
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </Card>
      </Col>
      <Col span={14}>
        <Card title={<Title level={4}>Metric Details</Title>} style={{ minHeight: 400 }}>
          {detailLoading ? (
            <Spin />
          ) : selectedMetric ? (
            <div>
              <p><b>Name:</b> {selectedMetric.name}</p>
              <p><b>Description:</b> {selectedMetric.description}</p>
              <p><b>Value Type:</b> {selectedMetric.valueType}</p>
              <p><b>Unit:</b> {selectedMetric.unit}</p>
              <p><b>Aggregation:</b> {selectedMetric.aggregation}</p>
              <p><b>Tags:</b> {selectedMetric.tags.join(', ')}</p>
              <p><b>Values:</b></p>
              <ul>
                {selectedMetric.values.map((v, idx) => (
                  <li key={idx}>{v.value} @ {v.timestamp}</li>
                ))}
              </ul>
            </div>
          ) : (
            <span>Select a metric to see details</span>
          )}
        </Card>
      </Col>
    </Row>
  );
}
