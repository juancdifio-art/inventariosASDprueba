'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('proveedores', [
      { id: 1, nombre: 'Proveedor Alfa', email: 'contacto@alfa.com', telefono: '111-111', direccion: 'Calle 1', activo: true, created_at: now, updated_at: now },
      { id: 2, nombre: 'Proveedor Beta', email: 'ventas@beta.com', telefono: '222-222', direccion: 'Calle 2', activo: true, created_at: now, updated_at: now },
      { id: 3, nombre: 'Proveedor Gamma', email: 'info@gamma.com', telefono: '333-333', direccion: 'Calle 3', activo: true, created_at: now, updated_at: now },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('proveedores', { id: { [Sequelize.Op.in]: [1,2,3] } }, {});
  }
};
