import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Renvoie les colonnes `date` (OID 1082) en chaîne brute 'YYYY-MM-DD'
// pour éviter tout décalage de fuseau horaire côté client.
pg.types.setTypeParser(1082, (value) => value);

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL manquant — copiez .env.example vers .env');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/** Raccourci pour exécuter une requête paramétrée. */
export function query(text, params) {
  return pool.query(text, params);
}

/** Exécute une fonction dans une transaction. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
