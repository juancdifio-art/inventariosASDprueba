'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_alertas_tipo\" AS ENUM ('stock_minimo', 'sin_movimiento', 'vencimiento', 'stock_critico');",
        { transaction }
      );

      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_alertas_estado\" AS ENUM ('activa', 'leida', 'resuelta', 'ignorada');",
        { transaction }
      );

      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_alertas_prioridad\" AS ENUM ('baja', 'media', 'alta');",
        { transaction }
      );

      await queryInterface.createTable('alertas', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        producto_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'productos', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        titulo: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        tipo: {
          type: Sequelize.ENUM({
            values: ['stock_minimo', 'sin_movimiento', 'vencimiento', 'stock_critico'],
            name: 'enum_alertas_tipo',
          }),
          allowNull: false,
        },
        estado: {
          type: Sequelize.ENUM({
            values: ['activa', 'leida', 'resuelta', 'ignorada'],
            name: 'enum_alertas_estado',
          }),
          allowNull: false,
          defaultValue: 'activa',
        },
        prioridad: {
          type: Sequelize.ENUM({
            values: ['baja', 'media', 'alta'],
            name: 'enum_alertas_prioridad',
          }),
          allowNull: false,
          defaultValue: 'media',
        },
        metadata: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        fecha_disparo: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        fecha_resolucion: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        activo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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

      await queryInterface.addIndex('alertas', ['tipo'], { name: 'alertas_tipo_idx', transaction });
      await queryInterface.addIndex('alertas', ['estado'], { name: 'alertas_estado_idx', transaction });
      await queryInterface.addIndex('alertas', ['prioridad'], { name: 'alertas_prioridad_idx', transaction });
      await queryInterface.addIndex('alertas', ['producto_id'], { name: 'alertas_producto_idx', transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('alertas', 'alertas_producto_idx', { transaction });
      await queryInterface.removeIndex('alertas', 'alertas_prioridad_idx', { transaction });
      await queryInterface.removeIndex('alertas', 'alertas_estado_idx', { transaction });
      await queryInterface.removeIndex('alertas', 'alertas_tipo_idx', { transaction });

      await queryInterface.dropTable('alertas', { transaction });

      await queryInterface.sequelize.query('DROP TYPE "enum_alertas_prioridad";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE "enum_alertas_estado";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE "enum_alertas_tipo";', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
