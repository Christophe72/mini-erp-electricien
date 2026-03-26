#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Charger manuellement les variables depuis .env
const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');

const newEnv = { ...process.env };
envContent.split('\n').forEach((line) => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '');
    if (key) {
      newEnv[key.trim()] = value;
    }
  }
});

// Vérifier que DATABASE_URL est chargée
console.log('✓ DATABASE_URL chargée :', newEnv.DATABASE_URL?.substring(0, 50) + '...');

// Régénérer Prisma Client avec l'environnement chargé
try {
  console.log('Régénération du client Prisma...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: newEnv,
    shell: true,
  });
} catch (error) {
  console.warn('Avertissement: Régénération du client échouée');
}

// Exécuter prisma db push avec toutes les variables d'environnement chargées
try {
  console.log('Synchronisation du schéma...');
  execSync('npx prisma db push', {
    stdio: 'inherit',
    env: newEnv,
    shell: true,
  });
} catch (error) {
  process.exit(1);
}



