const { drizzle } = require("drizzle-orm/node-postgres");
const pkg = require("pg");
const {
  DATABASE_URL,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = require("../src/utils/constants.js");
const schema = require("../db/schema/index.js");

const { Pool } = pkg;
console.log("db.js: ", DATABASE_URL);
const pool = new Pool({
  connectionString:
    DATABASE_URL ||
    `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
});

pool
  .connect()
  .then(async (client) => {
    console.log("Database connection has been established successfully.");

    // Enable the `pgcrypto` extension if needed
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
      console.log("pgcrypto extension enabled successfully.");
    } catch (error) {
      console.error("Error enabling pgcrypto extension:", error);
    } finally {
      client.release();
    }
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

// Exporting the Drizzle ORM instance
const database = drizzle(pool, { schema });
module.exports = database;
