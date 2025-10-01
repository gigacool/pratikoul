#!/usr/bin/env ts-node

import { promises as fs } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), '.data');
const TARGET_FILES = ['metrics.json', 'kpis.json', 'dashboards.json'];

async function resetTestData() {
  console.log('🔄 Resetting test database...\n');

  // Ensure .data directory exists
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('✓ Created .data directory');
  }

  // Clear all target files (reset to empty arrays)
  for (const file of TARGET_FILES) {
    try {
      const targetPath = join(DATA_DIR, file);
      await fs.writeFile(targetPath, '[]', 'utf-8');
      console.log(`✓ Reset ${file} to empty`);
    } catch (error: any) {
      console.error(`✗ Error resetting ${file}:`, error.message);
    }
  }

  console.log('\n✨ Test database reset successfully!');
  console.log('\n💡 To restore seed data, run: pnpm seed:db');
}

resetTestData().catch((error) => {
  console.error('❌ Failed to reset test data:', error);
  process.exit(1);
});
