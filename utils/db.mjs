import * as pg from "pg";
const { Pool } = pg.default;

const db = new Pool({
  connectionString:
    "postgresql://postgres:123qwe@localhost:5432/bookcollectiondb",
});

export default db;
