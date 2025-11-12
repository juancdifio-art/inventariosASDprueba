import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app.js';
import logger from './utils/logger.js';
import { sequelize } from './config/database.js';
import { startAlertScheduler } from './services/alertas.scheduler.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }

  const server = createServer(app);
  server.listen(PORT, () => {
    logger.info(`API listening on http://localhost:${PORT}`);
    startAlertScheduler();
  });
}

start();
