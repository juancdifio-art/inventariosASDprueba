'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movimientos', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      producto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo: { type: Sequelize.ENUM('entrada', 'salida', 'ajuste'), allowNull: false },
      cantidad: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      motivo: { type: Sequelize.STRING(200), allowNull: true },
      referencia: { type: Sequelize.STRING(120), allowNull: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.addIndex('movimientos', ['producto_id'], { name: 'idx_movimientos_producto_id' });
    await queryInterface.addIndex('movimientos', ['tipo'], { name: 'idx_movimientos_tipo' });
    await queryInterface.addIndex('movimientos', ['created_at'], { name: 'idx_movimientos_created_at' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('movimientos');
  }
};
