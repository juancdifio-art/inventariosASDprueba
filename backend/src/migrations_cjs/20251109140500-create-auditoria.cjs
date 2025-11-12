'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auditorias', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      tabla: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      registro_id: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      accion: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usuario_nombre: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      usuario_email: {
        type: Sequelize.STRING(180),
        allowNull: true,
      },
      valores_anteriores: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      valores_nuevos: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      cambios: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      metadatos: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      endpoint: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      metodo_http: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fecha_cambio: {
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
    });

    await queryInterface.addIndex('auditorias', ['tabla', 'registro_id'], {
      name: 'idx_auditorias_tabla_registro',
    });
    await queryInterface.addIndex('auditorias', ['usuario_id'], {
      name: 'idx_auditorias_usuario_id',
    });
    await queryInterface.addIndex('auditorias', ['fecha_cambio'], {
      name: 'idx_auditorias_fecha_cambio',
    });
    await queryInterface.addIndex('auditorias', ['accion'], {
      name: 'idx_auditorias_accion',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('auditorias');
  },
};
