import { Router } from 'express';
import { sequelize } from '../config/database.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({
      success: true,
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 'ERROR',
      database: 'Disconnected',
      message: err.message
    });
  }
});

export default router;
