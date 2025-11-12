/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'proveedores'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingColumns = new Set(existing.map((row) => row.column_name));

    const columnSql = [
      ['cuit', 'VARCHAR(20)'],
      ['celular', 'VARCHAR(50)'],
      ['ciudad', 'VARCHAR(120)'],
      ['provincia', 'VARCHAR(120)'],
      ['pais', 'VARCHAR(80)'],
      ['codigo_postal', 'VARCHAR(20)'],
      ['sitio_web', 'VARCHAR(180)'],
      ['contacto', 'VARCHAR(120)'],
      ['cargo_contacto', 'VARCHAR(120)'],
      ['email_contacto', 'VARCHAR(150)'],
      ['condicion_pago', 'VARCHAR(60)'],
      ['dias_entrega', 'INTEGER'],
      ['rubro', 'VARCHAR(120)'],
      ['logistica', 'VARCHAR(120)'],
      ['logistica_contacto', 'VARCHAR(120)'],
      ['rating', 'VARCHAR(20)'],
      ['monto_minimo', 'NUMERIC(12,2)'],
      ['notas', 'TEXT'],
    ];

    for (const [columnName, sqlType] of columnSql) {
      if (existingColumns.has(columnName)) {
        continue;
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE IF EXISTS proveedores
         ADD COLUMN IF NOT EXISTS "${columnName}" ${sqlType}`
      );
    }
  },

  async down(queryInterface) {
    await Promise.all([
      queryInterface.removeColumn('proveedores', 'cuit'),
      queryInterface.removeColumn('proveedores', 'celular'),
      queryInterface.removeColumn('proveedores', 'ciudad'),
      queryInterface.removeColumn('proveedores', 'provincia'),
      queryInterface.removeColumn('proveedores', 'pais'),
      queryInterface.removeColumn('proveedores', 'codigo_postal'),
      queryInterface.removeColumn('proveedores', 'sitio_web'),
      queryInterface.removeColumn('proveedores', 'contacto'),
      queryInterface.removeColumn('proveedores', 'cargo_contacto'),
      queryInterface.removeColumn('proveedores', 'email_contacto'),
      queryInterface.removeColumn('proveedores', 'condicion_pago'),
      queryInterface.removeColumn('proveedores', 'dias_entrega'),
      queryInterface.removeColumn('proveedores', 'rubro'),
      queryInterface.removeColumn('proveedores', 'logistica'),
      queryInterface.removeColumn('proveedores', 'logistica_contacto'),
      queryInterface.removeColumn('proveedores', 'rating'),
      queryInterface.removeColumn('proveedores', 'monto_minimo'),
      queryInterface.removeColumn('proveedores', 'notas'),
    ]);
  },
};
