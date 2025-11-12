'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('alertas_configuraciones', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        producto_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'productos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        stock_minimo_threshold: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        stock_critico_threshold: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        dias_sin_movimiento: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        frecuencia_minutos: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        destinatarios: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        activo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        last_run_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      }, { transaction });

      await queryInterface.addConstraint('alertas_configuraciones', {
        fields: ['producto_id'],
        type: 'unique',
        name: 'alertas_configuraciones_producto_unique',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('alertas_configuraciones', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
