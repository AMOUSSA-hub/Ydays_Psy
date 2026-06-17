/**
 * Applique le schéma puis les données de référence.
 * Usage : npm run migrate
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  const seed = readFileSync(join(__dirname, 'seed.sql'), 'utf8');

  console.log('[migrate] application du schéma…');
  await pool.query(schema);
  console.log('[migrate] insertion des données de référence…');
  await pool.query(seed);
  console.log('[migrate] terminé ✅');
  await pool.end();
}

run().catch((err) => {
  console.error('[migrate] échec :', err);
  process.exit(1);
});
