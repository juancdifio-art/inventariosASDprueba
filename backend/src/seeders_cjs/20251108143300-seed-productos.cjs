'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('productos', [
      { id: 1, codigo: 'P001', nombre: 'Producto 1', descripcion: 'Desc 1', categoria_id: 1, proveedor_id: 1, stock_actual: 2, precio: 100, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
      { id: 2, codigo: 'P002', nombre: 'Producto 2', descripcion: 'Desc 2', categoria_id: 1, proveedor_id: 2, stock_actual: 10, precio: 150, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
      { id: 3, codigo: 'P003', nombre: 'Producto 3', descripcion: 'Desc 3', categoria_id: 2, proveedor_id: 3, stock_actual: 0, precio: 80, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
      { id: 4, codigo: 'P004', nombre: 'Producto 4', descripcion: 'Desc 4', categoria_id: 2, proveedor_id: 1, stock_actual: 4, precio: 120, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
      { id: 5, codigo: 'P005', nombre: 'Producto 5', descripcion: 'Desc 5', categoria_id: 3, proveedor_id: 2, stock_actual: 25, precio: 200, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
      { id: 6, codigo: 'P006', nombre: 'Producto 6', descripcion: 'Desc 6', categoria_id: 3, proveedor_id: 3, stock_actual: 7, precio: 60, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
      { id: 7, codigo: 'P007', nombre: 'Producto 7', descripcion: 'Desc 7', categoria_id: 1, proveedor_id: 1, stock_actual: 15, precio: 90, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
      { id: 8, codigo: 'P008', nombre: 'Producto 8', descripcion: 'Desc 8', categoria_id: 2, proveedor_id: 2, stock_actual: 3, precio: 75, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
      { id: 9, codigo: 'P009', nombre: 'Producto 9', descripcion: 'Desc 9', categoria_id: 3, proveedor_id: 3, stock_actual: 50, precio: 300, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
      { id: 10, codigo: 'P010', nombre: 'Producto 10', descripcion: 'Desc 10', categoria_id: 1, proveedor_id: 2, stock_actual: 1, precio: 40, atributos_personalizados: null, activo: true, created_at: now, updated_at: now },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('productos', { id: { [Sequelize.Op.in]: [1,2,3,4,5,6,7,8,9,10] } }, {});
  }
};
