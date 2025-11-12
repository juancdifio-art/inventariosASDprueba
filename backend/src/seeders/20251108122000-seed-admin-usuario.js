import bcrypt from 'bcryptjs';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
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

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', { email: 'admin@inventarios.com' }, {});
  }
};
