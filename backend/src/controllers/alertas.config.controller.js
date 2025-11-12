import { processStockAlerts } from '../services/alertas.scheduler.js';

export const runStockAlerts = async (_req, res) => {
  try {
    await processStockAlerts();
    return res.json({ success: true, message: 'Alertas generadas correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al generar alertas', error: { type: 'INTERNAL_ERROR', details: error.message } });
  }
};
