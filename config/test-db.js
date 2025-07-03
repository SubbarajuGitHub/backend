import { db } from './database.js';

async function testConnection() {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('Connected to DB at:', result.rows[0].now);
  } catch (err) {
    console.error('DB connection failed:', err.message);
  } finally {
    await db.end();
  }
}

testConnection();
