/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('usuarios').then(() => true).catch(() => false);
    if (tableExists) {
      return;
    }

    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      rol: {
        type: Sequelize.ENUM('admin', 'gerente', 'usuario'),
        allowNull: false,
        defaultValue: 'admin'
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

    await queryInterface.addIndex('usuarios', ['email'], {
      unique: true,
      name: 'idx_usuarios_email_unique'
    });
    await queryInterface.addIndex('usuarios', ['activo'], {
      name: 'idx_usuarios_activo'
    });
    await queryInterface.addIndex('usuarios', ['rol'], {
      name: 'idx_usuarios_rol'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuarios');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_usuarios_rol\";");
  }
};
