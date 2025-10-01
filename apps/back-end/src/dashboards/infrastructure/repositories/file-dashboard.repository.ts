import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Dashboard } from '../../domain/entities/dashboard.entity';
import { DashboardRepository } from '../../domain/repositories/dashboard.repository';

const DASHBOARDS_FILE = join(process.cwd(), '.data', 'dashboards.json');

@Injectable()
export class FileDashboardRepository extends DashboardRepository {
  private async ensureFileExists(): Promise<void> {
    try {
      await fs.access(DASHBOARDS_FILE);
    } catch {
      await fs.mkdir(join(process.cwd(), '.data'), { recursive: true });
      await fs.writeFile(DASHBOARDS_FILE, '[]', 'utf-8');
    }
  }

  private async readFile(): Promise<Dashboard[]> {
    await this.ensureFileExists();
    try {
      const data = await fs.readFile(DASHBOARDS_FILE, 'utf-8');
      return JSON.parse(data) as Dashboard[];
    } catch {
      return [];
    }
  }

  private async writeFile(dashboards: Dashboard[]): Promise<void> {
    await this.ensureFileExists();
    await fs.writeFile(DASHBOARDS_FILE, JSON.stringify(dashboards, null, 2), 'utf-8');
  }

  async findAll(): Promise<Dashboard[]> {
    return this.readFile();
  }

  async findById(uuid: string): Promise<Dashboard | null> {
    const dashboards = await this.readFile();
    return dashboards.find((d) => d.uuid === uuid) ?? null;
  }

  async save(dashboard: Dashboard): Promise<void> {
    const dashboards = await this.readFile();
    dashboards.push(dashboard);
    await this.writeFile(dashboards);
  }

  async update(uuid: string, partial: Partial<Dashboard>): Promise<void> {
    const dashboards = await this.readFile();
    const idx = dashboards.findIndex(d => d.uuid === uuid);
    if (idx === -1) return;
    dashboards[idx] = { ...dashboards[idx], ...partial };
    await this.writeFile(dashboards);
  }

  async delete(uuid: string): Promise<void> {
    const dashboards = await this.readFile();
    const filtered = dashboards.filter(d => d.uuid !== uuid);
    await this.writeFile(filtered);
  }
}
