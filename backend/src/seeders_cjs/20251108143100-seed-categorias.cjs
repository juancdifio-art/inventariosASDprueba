'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('categorias', [
      { id: 1, nombre: 'General', descripcion: 'Productos generales', nivel: 0, activo: true, created_at: now, updated_at: now },
      { id: 2, nombre: 'Insumos', descripcion: 'Insumos y consumibles', nivel: 0, activo: true, created_at: now, updated_at: now },
      { id: 3, nombre: 'Servicios', descripcion: 'Servicios asociados', nivel: 0, activo: true, created_at: now, updated_at: now },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categorias', { id: { [Sequelize.Op.in]: [1,2,3] } }, {});
  }
};
