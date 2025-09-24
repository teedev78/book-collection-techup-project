import * as pg from "pg";
const { Pool } = pg.default;

const db = new Pool({
  connectionString: `postgresql://postgres:${process.env.postgres_SECRET}@localhost:5432/bookcollectiondb`,
});

export default db;
