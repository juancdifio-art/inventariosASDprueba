'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000);

    await queryInterface.bulkInsert('movimientos', [
      { id: 1, producto_id: 1, tipo: 'entrada', cantidad: 10, motivo: 'Compra inicial', referencia: 'OC-1001', activo: true, created_at: minutesAgo(300), updated_at: minutesAgo(300) },
      { id: 2, producto_id: 2, tipo: 'salida', cantidad: 3, motivo: 'Venta', referencia: 'V-2001', activo: true, created_at: minutesAgo(280), updated_at: minutesAgo(280) },
      { id: 3, producto_id: 3, tipo: 'ajuste', cantidad: -2, motivo: 'Ajuste inventario', referencia: 'AJ-3001', activo: true, created_at: minutesAgo(260), updated_at: minutesAgo(260) },
      { id: 4, producto_id: 4, tipo: 'entrada', cantidad: 5, motivo: 'Reposición', referencia: 'OC-1002', activo: true, created_at: minutesAgo(240), updated_at: minutesAgo(240) },
      { id: 5, producto_id: 5, tipo: 'salida', cantidad: 1, motivo: 'Consumo interno', referencia: 'CI-4001', activo: true, created_at: minutesAgo(220), updated_at: minutesAgo(220) },
      { id: 6, producto_id: 6, tipo: 'entrada', cantidad: 12, motivo: 'Compra', referencia: 'OC-1003', activo: true, created_at: minutesAgo(200), updated_at: minutesAgo(200) },
      { id: 7, producto_id: 7, tipo: 'salida', cantidad: 4, motivo: 'Venta', referencia: 'V-2002', activo: true, created_at: minutesAgo(180), updated_at: minutesAgo(180) },
      { id: 8, producto_id: 8, tipo: 'ajuste', cantidad: 1, motivo: 'Reconteo', referencia: 'AJ-3002', activo: true, created_at: minutesAgo(160), updated_at: minutesAgo(160) },
      { id: 9, producto_id: 9, tipo: 'salida', cantidad: 7, motivo: 'Venta mayorista', referencia: 'V-2003', activo: true, created_at: minutesAgo(140), updated_at: minutesAgo(140) },
      { id: 10, producto_id: 10, tipo: 'entrada', cantidad: 8, motivo: 'Compra', referencia: 'OC-1004', activo: true, created_at: minutesAgo(120), updated_at: minutesAgo(120) },
      { id: 11, producto_id: 1, tipo: 'salida', cantidad: 2, motivo: 'Venta', referencia: 'V-2004', activo: true, created_at: minutesAgo(100), updated_at: minutesAgo(100) },
      { id: 12, producto_id: 2, tipo: 'entrada', cantidad: 6, motivo: 'Reposición', referencia: 'OC-1005', activo: true, created_at: minutesAgo(80), updated_at: minutesAgo(80) },
      { id: 13, producto_id: 3, tipo: 'salida', cantidad: 1, motivo: 'Muestra', referencia: 'MU-5001', activo: true, created_at: minutesAgo(60), updated_at: minutesAgo(60) },
      { id: 14, producto_id: 4, tipo: 'entrada', cantidad: 3, motivo: 'Devolución proveedor', referencia: 'DV-6001', activo: true, created_at: minutesAgo(40), updated_at: minutesAgo(40) },
      { id: 15, producto_id: 5, tipo: 'salida', cantidad: 5, motivo: 'Venta', referencia: 'V-2005', activo: true, created_at: minutesAgo(20), updated_at: minutesAgo(20) },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('movimientos', { id: { [Sequelize.Op.in]: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] } }, {});
  }
};
