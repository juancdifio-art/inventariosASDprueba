'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categorias', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      padre_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'categorias', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      nivel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('categorias', ['padre_id'], { name: 'idx_categorias_padre_id' });
    await queryInterface.addIndex('categorias', ['activo'], { name: 'idx_categorias_activo' });
    await queryInterface.addIndex('categorias', ['nivel'], { name: 'idx_categorias_nivel' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categorias');
  }
};
