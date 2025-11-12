require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'inventariosasd',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  LOG_LEVEL = 'info'
} = process.env;

module.exports = {
  development: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: 'postgres',
    logging: LOG_LEVEL === 'debug' ? console.log : false
  },
  test: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: 'postgres',
    logging: false
  }
};
