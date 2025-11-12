'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('productos', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      codigo: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      categoria_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'categorias', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      proveedor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'proveedores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      stock_actual: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      precio: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      atributos_personalizados: { type: Sequelize.JSONB, allowNull: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.addIndex('productos', ['categoria_id'], { name: 'idx_productos_categoria_id' });
    await queryInterface.addIndex('productos', ['proveedor_id'], { name: 'idx_productos_proveedor_id' });
    await queryInterface.addIndex('productos', ['activo'], { name: 'idx_productos_activo' });
    await queryInterface.addIndex('productos', ['stock_actual'], { name: 'idx_productos_stock_actual' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('productos');
  }
};
