'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('proveedores', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: true },
      telefono: { type: Sequelize.STRING(50), allowNull: true },
      direccion: { type: Sequelize.STRING(250), allowNull: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.addIndex('proveedores', ['nombre'], { name: 'idx_proveedores_nombre' });
    await queryInterface.addIndex('proveedores', ['email'], { name: 'idx_proveedores_email' });
    await queryInterface.addIndex('proveedores', ['activo'], { name: 'idx_proveedores_activo' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('proveedores');
  }
};
