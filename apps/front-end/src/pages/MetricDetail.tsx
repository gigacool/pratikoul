import React from 'react';
import { Card, Spin, Typography } from 'antd';

const { Title } = Typography;

export interface MetricDetailProps {
  selectedMetric: {
    name: string;
    description: string;
    valueType: string;
    unit: string;
    aggregation: string;
    tags: string[];
    values: Array<{ value: number; timestamp: string }>;
  } | null;
  loading: boolean;
}

export const MetricDetail: React.FC<MetricDetailProps> = ({ selectedMetric, loading }) => (
  <Card title={<Title level={4}>Metric Details</Title>} style={{ minHeight: 400 }}>
    {loading ? (
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
);
