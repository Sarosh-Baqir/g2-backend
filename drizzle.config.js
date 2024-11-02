const { defineConfig } = require("drizzle-kit");
const { DATABASE_URL } = require("./src/utils/constants");

const config = {
  dialect: "postgresql",
  schema: "./db/schema",
  out: "./migrations",
  dbCredentials: {
    url: DATABASE_URL,
  },
};

console.log("Drizzle config:", config); // Log the entire config
module.exports = defineConfig(config);
