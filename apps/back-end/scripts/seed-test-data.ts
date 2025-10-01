#!/usr/bin/env ts-node

import { promises as fs } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), '.data');
const SEED_FILES = [
  { seed: 'users-seed.json', target: 'users.json' },
  { seed: 'metrics-seed.json', target: 'metrics.json' },
  { seed: 'kpis-seed.json', target: 'kpis.json' },
  { seed: 'dashboards-seed.json', target: 'dashboards.json' },
];

async function seedTestData() {
  console.log('🌱 Seeding test database...\n');

  // Ensure .data directory exists
  try {
    await fs.access(DATA_DIR);
    console.log('✓ .data directory exists');
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('✓ Created .data directory');
  }

  // Copy seed files to target files
  for (const { seed, target } of SEED_FILES) {
    try {
      const seedPath = join(DATA_DIR, seed);
      const targetPath = join(DATA_DIR, target);

      const data = await fs.readFile(seedPath, 'utf-8');
      await fs.writeFile(targetPath, data, 'utf-8');

      const jsonData = JSON.parse(data);
      const count = Array.isArray(jsonData) ? jsonData.length : 1;

      console.log(`✓ Seeded ${target} (${count} items)`);
    } catch (error: any) {
      console.error(`✗ Error seeding ${target}:`, error.message);
    }
  }

  console.log('\n🎉 Test database seeded successfully!');
  console.log('\n📊 Available data:');
  console.log('   - 3 Users (admin@example.com, viewer@example.com, demo@example.com)');
  console.log('   - 8 Metrics with sample values');
  console.log('   - 9 KPIs with targets and thresholds');
  console.log('   - 2 Dashboards with configured tiles');
  console.log('\n💡 Start the server with: pnpm start:dev');
}

seedTestData().catch((error) => {
  console.error('❌ Failed to seed test data:', error);
  process.exit(1);
});
