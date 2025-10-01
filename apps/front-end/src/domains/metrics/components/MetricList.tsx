import React from 'react';
import { Table, Pagination, Card, Typography, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MetricListItem, MetricListProps } from '../types';

const { Title } = Typography;

export const MetricList: React.FC<MetricListProps> = ({
  metrics,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onSelect,
  selectedUuid,
  onAdd,
}) => {
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
  {
      title: 'Last Value',
      dataIndex: 'lastValue',
      key: 'lastValue',
    },
        {
      title: 'Last Updated',
      dataIndex: 'lastTimestamp',
      key: 'lastTimestamp',
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Metrics</Title>
          {onAdd && <Button type="primary" onClick={onAdd}>Add Metric</Button>}
        </div>
      }
    >
      <Table
        rowKey="uuid"
        columns={columns}
        dataSource={metrics}
        loading={loading}
        pagination={false}
        onRow={record => ({
          onClick: () => onSelect(record.uuid),
          style: { cursor: 'pointer' },
        })}
        rowClassName={record => (selectedUuid === record.uuid ? 'ant-table-row-selected' : '')}
      />
      <Pagination
        style={{ marginTop: 16, textAlign: 'right' }}
        current={page}
        pageSize={limit}
        total={total}
        onChange={onPageChange}
        showSizeChanger
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </Card>
  );
};
