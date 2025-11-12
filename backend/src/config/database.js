import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'inventario_abc',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  NODE_ENV = 'development',
  LOG_LEVEL = 'info'
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: LOG_LEVEL === 'debug' ? console.log : false,
  dialectOptions: NODE_ENV === 'production' ? {
    ssl: false
  } : {}
});
