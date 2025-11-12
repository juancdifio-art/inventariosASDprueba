'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('configuracion_campos', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      etiqueta: { type: Sequelize.STRING(150), allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      tipo: {
        type: Sequelize.ENUM(
          'texto',
          'numero',
          'decimal',
          'fecha',
          'boolean',
          'select',
          'multi_select',
          'email',
          'telefono',
          'url',
          'color',
          'texto_largo'
        ),
        allowNull: false,
      },
      aplica_a: {
        type: Sequelize.ENUM('productos', 'categorias', 'proveedores', 'movimientos', 'alertas'),
        allowNull: false,
        defaultValue: 'productos',
      },
      grupo: { type: Sequelize.STRING(120), allowNull: true },
      industria: { type: Sequelize.STRING(120), allowNull: true },
      orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      placeholder: { type: Sequelize.STRING(200), allowNull: true },
      ayuda: { type: Sequelize.STRING(250), allowNull: true },
      icono: { type: Sequelize.STRING(80), allowNull: true },
      valor_default: { type: Sequelize.STRING(255), allowNull: true },
      opciones: { type: Sequelize.JSONB, allowNull: true },
      validaciones: { type: Sequelize.JSONB, allowNull: true },
      obligatorio: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      visible_en_listado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      visible_en_detalle: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('configuracion_campos', ['aplica_a'], {
      name: 'idx_configuracion_campos_aplica_a',
    });
    await queryInterface.addIndex('configuracion_campos', ['grupo'], {
      name: 'idx_configuracion_campos_grupo',
    });
    await queryInterface.addIndex('configuracion_campos', ['activo'], {
      name: 'idx_configuracion_campos_activo',
    });
    await queryInterface.addIndex('configuracion_campos', ['industria'], {
      name: 'idx_configuracion_campos_industria',
    });

    await queryInterface.createTable('templates_industria', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(150), allowNull: false },
      codigo: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      industria: { type: Sequelize.STRING(120), allowNull: true },
      color: { type: Sequelize.STRING(20), allowNull: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      campos_config: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('templates_industria', ['industria'], {
      name: 'idx_templates_industria_industria',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('templates_industria');
    await queryInterface.dropTable('configuracion_campos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_configuracion_campos_tipo";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_configuracion_campos_aplica_a";');
  },
};
