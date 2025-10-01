import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Metric } from '../../domain/entities/metric.entity';
import { MetricRepository } from '../../domain/repositories/metric.repository';

const METRICS_FILE = join(process.cwd(), '.data', 'metrics.json');

@Injectable()
export class FileMetricRepository extends MetricRepository {
  private async ensureFileExists(): Promise<void> {
    try {
      await fs.access(METRICS_FILE);
    } catch {
      await fs.mkdir(join(process.cwd(), '.data'), { recursive: true });
      await fs.writeFile(METRICS_FILE, '[]', 'utf-8');
    }
  }

  private async readFile(): Promise<Metric[]> {
    await this.ensureFileExists();
    try {
      const data = await fs.readFile(METRICS_FILE, 'utf-8');
      return JSON.parse(data) as Metric[];
    } catch {
      return [];
    }
  }

  private async writeFile(metrics: Metric[]): Promise<void> {
    await this.ensureFileExists();
    await fs.writeFile(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf-8');
  }

  async findAll(): Promise<Metric[]> {
    return this.readFile();
  }

  async findById(uuid: string): Promise<Metric | null> {
    const metrics = await this.readFile();
    return metrics.find((m) => m.uuid === uuid) ?? null;
  }

  async save(metric: Metric): Promise<void> {
    const metrics = await this.readFile();
    metrics.push(metric);
    await this.writeFile(metrics);
  }

  async update(uuid: string, partial: Partial<Metric>): Promise<void> {
    const metrics = await this.readFile();
    const idx = metrics.findIndex(m => m.uuid === uuid);
    if (idx === -1) return;
    metrics[idx] = { ...metrics[idx], ...partial };
    await this.writeFile(metrics);
  }
}
