'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const password = 'admin123';
    const password_hash = await bcrypt.hash(password, 10);
    await queryInterface.bulkInsert('usuarios', [{
      nombre: 'Administrador',
      email: 'admin@inventarios.com',
      password_hash,
      rol: 'admin',
      activo: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuarios', { email: 'admin@inventarios.com' }, {});
  }
};
