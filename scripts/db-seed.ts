#!/usr/bin/env node
import 'dotenv/config.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Charger manuellement les variables depuis .env
const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');

envContent.split('\n').forEach((line) => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '');
    if (key) {
      process.env[key.trim()] = value;
    }
  }
});

// Vérifier que DATABASE_URL est chargée
console.log('✓ DATABASE_URL chargée :', process.env.DATABASE_URL?.substring(0, 50) + '...');

// MAINTENANT on importe seed après que les variables soient chargées
import('../prisma/seed.js').catch((error) => {
  console.error('Erreur seed:', error);
  process.exit(1);
});

