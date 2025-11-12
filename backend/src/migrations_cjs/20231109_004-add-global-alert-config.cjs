'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint('alertas_configuraciones', 'alertas_configuraciones_producto_unique', { transaction });

      await queryInterface.changeColumn('alertas_configuraciones', 'producto_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }, { transaction });

      await queryInterface.addColumn('alertas_configuraciones', 'aplica_todos', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }, { transaction });

      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX alertas_configuraciones_producto_unico ON alertas_configuraciones (producto_id) WHERE aplica_todos = false;',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX alertas_configuraciones_global_unico ON alertas_configuraciones (aplica_todos) WHERE aplica_todos = true;',
        { transaction },
      );

      await queryInterface.addIndex('productos', ['categoria_id', 'proveedor_id'], {
        name: 'idx_productos_categoria_proveedor',
        transaction,
      });

      await queryInterface.addIndex('productos', ['activo', 'stock_actual'], {
        name: 'idx_productos_activo_stock',
        transaction,
      });

      await queryInterface.addIndex('movimientos', ['producto_id', 'created_at'], {
        name: 'idx_movimientos_producto_fecha',
        transaction,
      });

      await queryInterface.addIndex('movimientos', ['tipo', 'created_at'], {
        name: 'idx_movimientos_tipo_fecha',
        transaction,
      });

      await queryInterface.addIndex('alertas', ['tipo', 'prioridad', 'estado'], {
        name: 'idx_alertas_tipo_prioridad_estado',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS alertas_configuraciones_global_unico;', { transaction });
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS alertas_configuraciones_producto_unico;', { transaction });

      await queryInterface.removeColumn('alertas_configuraciones', 'aplica_todos', { transaction });

      await queryInterface.changeColumn('alertas_configuraciones', 'producto_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }, { transaction });

      await queryInterface.addConstraint('alertas_configuraciones', {
        fields: ['producto_id'],
        type: 'unique',
        name: 'alertas_configuraciones_producto_unique',
        transaction,
      });

      await queryInterface.removeIndex('alertas', 'idx_alertas_tipo_prioridad_estado', { transaction });
      await queryInterface.removeIndex('movimientos', 'idx_movimientos_tipo_fecha', { transaction });
      await queryInterface.removeIndex('movimientos', 'idx_movimientos_producto_fecha', { transaction });
      await queryInterface.removeIndex('productos', 'idx_productos_activo_stock', { transaction });
      await queryInterface.removeIndex('productos', 'idx_productos_categoria_proveedor', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
