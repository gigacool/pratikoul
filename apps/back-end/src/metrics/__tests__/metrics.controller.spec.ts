/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MetricsModule } from '../metrics.module';
import { MetricValueType } from '../domain/enums/metric-value-type.enum';
import { MetricAggregation } from '../domain/enums/metric-aggregation.enum';

// FIXME: these tests are hard to read and should be improved

describe('MetricsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MetricsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/metrics (POST, GET)', async () => {
    const metric = {
      name: 'Test Metric',
      description: 'A test metric',
      valueType: MetricValueType.Integer,
      unit: 'units',
      values: [{ value: 42, timestamp: new Date().toISOString() }],
      aggregation: MetricAggregation.Sum,
      tags: ['test'],
    };
    await request(app.getHttpServer())
      .post('/metrics')
      .send(metric)
      .expect(201);

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);

    const metrics = res.body as Array<{ name: string }>;
    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics[0].name).toBe('Test Metric');
  });

  it('/metrics/:id (PUT)', async () => {
    const getRes = await request(app.getHttpServer()).get('/metrics');
    const metrics = getRes.body as Array<{
      uuid: string;
      description?: string;
    }>;
    const metric = metrics[0];
    await request(app.getHttpServer())
      .put(`/metrics/${metric.uuid}`)
      .send({ description: 'Updated' })
      .expect(200);
    const updated = await request(app.getHttpServer()).get(
      `/metrics/${metric.uuid}`,
    );
    expect(updated.body.description).toBe('Updated');
  });
});
