import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Kpi } from '../../domain/entities/kpi.entity';
import { KpiRepository } from '../../domain/repositories/kpi.repository';

const KPIS_FILE = join(process.cwd(), '.data', 'kpis.json');

@Injectable()
export class FileKpiRepository extends KpiRepository {
  private async ensureFileExists(): Promise<void> {
    try {
      await fs.access(KPIS_FILE);
    } catch {
      await fs.mkdir(join(process.cwd(), '.data'), { recursive: true });
      await fs.writeFile(KPIS_FILE, '[]', 'utf-8');
    }
  }

  private async readFile(): Promise<Kpi[]> {
    await this.ensureFileExists();
    try {
      const data = await fs.readFile(KPIS_FILE, 'utf-8');
      return JSON.parse(data) as Kpi[];
    } catch {
      return [];
    }
  }

  private async writeFile(kpis: Kpi[]): Promise<void> {
    await this.ensureFileExists();
    await fs.writeFile(KPIS_FILE, JSON.stringify(kpis, null, 2), 'utf-8');
  }

  async findAll(): Promise<Kpi[]> {
    return this.readFile();
  }

  async findById(uuid: string): Promise<Kpi | null> {
    const kpis = await this.readFile();
    return kpis.find((k) => k.uuid === uuid) ?? null;
  }

  async findByMetricUuid(metricUuid: string): Promise<Kpi[]> {
    const kpis = await this.readFile();
    return kpis.filter((k) => k.metricUuid === metricUuid);
  }

  async save(kpi: Kpi): Promise<void> {
    const kpis = await this.readFile();
    kpis.push(kpi);
    await this.writeFile(kpis);
  }

  async update(uuid: string, partial: Partial<Kpi>): Promise<void> {
    const kpis = await this.readFile();
    const idx = kpis.findIndex(k => k.uuid === uuid);
    if (idx === -1) return;
    kpis[idx] = { ...kpis[idx], ...partial };
    await this.writeFile(kpis);
  }

  async delete(uuid: string): Promise<void> {
    const kpis = await this.readFile();
    const filtered = kpis.filter(k => k.uuid !== uuid);
    await this.writeFile(filtered);
  }
}
