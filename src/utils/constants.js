const dotenv = require("dotenv");

dotenv.config({ path: ".env" });

const {
  SERVER_PORT,
  SERVER_HOST,
  DATABASE_URL,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_NAME,
} = process.env;

console.log("constants: ", DATABASE_URL);

module.exports = {
  SERVER_PORT,
  SERVER_HOST,
  DATABASE_URL,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_NAME,
};
