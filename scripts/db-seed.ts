#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

for (const envName of ['.env.local', '.env']) {
  const envPath = resolve(process.cwd(), envName);

  if (!existsSync(envPath)) {
    continue;
  }

  const envContent = readFileSync(envPath, 'utf-8');

  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

console.log('✓ DATABASE_URL chargée :', `${process.env.DATABASE_URL?.substring(0, 50) ?? ''}...`);

import('../prisma/seed.ts').catch((error) => {
  console.error('Erreur seed:', error);
  process.exit(1);
});

