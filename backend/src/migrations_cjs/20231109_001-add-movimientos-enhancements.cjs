'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_movimientos_tipo" RENAME TO "enum_movimientos_tipo_old";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_movimientos_tipo\" AS ENUM ('entrada', 'salida', 'ajuste', 'transferencia_entrada', 'transferencia_salida');",
        { transaction }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "movimientos" ALTER COLUMN "tipo" TYPE "enum_movimientos_tipo" USING "tipo"::text::"enum_movimientos_tipo";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_movimientos_tipo_old";',
        { transaction }
      );

      await queryInterface.addColumn('movimientos', 'stock_anterior', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      }, { transaction });

      await queryInterface.addColumn('movimientos', 'stock_nuevo', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      }, { transaction });

      await queryInterface.addColumn('movimientos', 'costo_unitario', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('movimientos', 'costo_total', {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
      }, { transaction });

      await queryInterface.addIndex('movimientos', ['producto_id', 'tipo', 'created_at'], {
        name: 'movimientos_producto_tipo_created_at_idx',
        transaction,
      });

      await queryInterface.sequelize.query(
        'UPDATE "movimientos" SET stock_anterior = cantidad, stock_nuevo = cantidad WHERE stock_anterior = 0 AND stock_nuevo = 0;',
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('movimientos', 'movimientos_producto_tipo_created_at_idx', { transaction });
      await queryInterface.removeColumn('movimientos', 'costo_total', { transaction });
      await queryInterface.removeColumn('movimientos', 'costo_unitario', { transaction });
      await queryInterface.removeColumn('movimientos', 'stock_nuevo', { transaction });
      await queryInterface.removeColumn('movimientos', 'stock_anterior', { transaction });

      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_movimientos_tipo" RENAME TO "enum_movimientos_tipo_new";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_movimientos_tipo\" AS ENUM ('entrada', 'salida', 'ajuste');",
        { transaction }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "movimientos" ALTER COLUMN "tipo" TYPE "enum_movimientos_tipo" USING "tipo"::text::"enum_movimientos_tipo";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_movimientos_tipo_new";',
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
