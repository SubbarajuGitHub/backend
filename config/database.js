// db.js
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const db = new Pool({
  host: "localhost",
  port: 8000,
  user: "postgres",
  password: "1234",
  database: "website_analytics",
});

// PG_HOST=localhost
// PG_PORT=8000
// PG_USER=postgres
// PG_PASSWORD=1234
// PG_DATABASE=website_analytics
