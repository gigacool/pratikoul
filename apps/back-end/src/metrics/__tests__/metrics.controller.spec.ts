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


  it('/metrics (POST, GET paginated)', async () => {
    // Create 5 metrics for pagination
    for (let i = 1; i <= 5; i++) {
      await request(app.getHttpServer())
        .post('/metrics')
        .send({
          name: `Metric ${i}`,
          description: `Description ${i}`,
          valueType: MetricValueType.Integer,
          unit: 'units',
          values: [{ value: i, timestamp: new Date().toISOString() }],
          aggregation: MetricAggregation.Sum,
          tags: ['test'],
        })
        .expect(201);
    }

    // Page 1, limit 2
    const res1 = await request(app.getHttpServer())
      .get('/metrics?page=1&limit=2')
      .expect(200);
    expect(Array.isArray(res1.body.items)).toBe(true);
    expect(res1.body.items.length).toBe(2);
    expect(res1.body.page).toBe(1);
    expect(res1.body.limit).toBe(2);
    expect(res1.body.total).toBeGreaterThanOrEqual(5);
    expect(res1.body._links.first.href).toContain('page=1');
    expect(res1.body._links.next.href).toContain('page=2');
    expect(res1.body._links.prev).toBeUndefined();

    // Page 2, limit 2
    const res2 = await request(app.getHttpServer())
      .get('/metrics?page=2&limit=2')
      .expect(200);
    expect(res2.body.items.length).toBe(2);
    expect(res2.body.page).toBe(2);
    expect(res2.body._links.prev.href).toContain('page=1');
    expect(res2.body._links.next.href).toContain('page=3');
    expect(res2.body._links.first.href).toContain('page=1');
    expect(res2.body._links.last.href).toContain('page=');

    // Last page
    const lastPage = Math.ceil(res2.body.total / res2.body.limit);
    const resLast = await request(app.getHttpServer())
      .get(`/metrics?page=${lastPage}&limit=2`)
      .expect(200);
    expect(resLast.body.page).toBe(lastPage);
    expect(resLast.body._links.next).toBeUndefined();
    if (lastPage > 1) {
      expect(resLast.body._links.prev.href).toContain(`page=${lastPage - 1}`);
    }
    expect(resLast.body._links.last.href).toContain(`page=${lastPage}`);

    // Out-of-range page
    const resOut = await request(app.getHttpServer())
      .get('/metrics?page=999&limit=2')
      .expect(200);
    expect(resOut.body.items.length).toBe(0);
    expect(resOut.body.page).toBe(999);
    expect(resOut.body._links.first.href).toContain('page=1');
    expect(resOut.body._links.last.href).toContain('page=');
  });

  it('/metrics/:id (PUT)', async () => {
    const getRes = await request(app.getHttpServer()).get('/metrics');
    const metrics = getRes.body.items as Array<{
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
