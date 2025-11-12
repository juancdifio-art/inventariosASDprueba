import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  rol: { type: DataTypes.ENUM('admin', 'gerente', 'usuario'), allowNull: false, defaultValue: 'admin' },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'usuarios',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export const Categoria = sequelize.define('Categoria', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  padre_id: { type: DataTypes.INTEGER, allowNull: true },
  nivel: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'categorias',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export const Proveedor = sequelize.define('Proveedor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  cuit: { type: DataTypes.STRING(20), allowNull: true },
  email: { type: DataTypes.STRING(150), allowNull: true },
  telefono: { type: DataTypes.STRING(50), allowNull: true },
  celular: { type: DataTypes.STRING(50), allowNull: true },
  direccion: { type: DataTypes.STRING(250), allowNull: true },
  ciudad: { type: DataTypes.STRING(120), allowNull: true },
  provincia: { type: DataTypes.STRING(120), allowNull: true },
  pais: { type: DataTypes.STRING(80), allowNull: true },
  codigo_postal: { type: DataTypes.STRING(20), allowNull: true },
  sitio_web: { type: DataTypes.STRING(180), allowNull: true },
  contacto: { type: DataTypes.STRING(120), allowNull: true },
  cargo_contacto: { type: DataTypes.STRING(120), allowNull: true },
  email_contacto: { type: DataTypes.STRING(150), allowNull: true },
  condicion_pago: { type: DataTypes.STRING(60), allowNull: true },
  dias_entrega: { type: DataTypes.INTEGER, allowNull: true },
  rubro: { type: DataTypes.STRING(120), allowNull: true },
  logistica: { type: DataTypes.STRING(120), allowNull: true },
  logistica_contacto: { type: DataTypes.STRING(120), allowNull: true },
  rating: { type: DataTypes.STRING(20), allowNull: true },
  monto_minimo: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  notas: { type: DataTypes.TEXT, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'proveedores',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export const Producto = sequelize.define('Producto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  categoria_id: { type: DataTypes.INTEGER, allowNull: true },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
  stock_actual: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  stock_minimo: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  precio: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  atributos_personalizados: { type: DataTypes.JSONB, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'productos',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'Categoria' });
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });

Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'Proveedor' });
Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos' });

export const Movimiento = sequelize.define('Movimiento', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: {
    type: DataTypes.ENUM('entrada', 'salida', 'ajuste', 'transferencia_entrada', 'transferencia_salida'),
    allowNull: false,
  },
  cantidad: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  stock_anterior: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  stock_nuevo: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  costo_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  costo_total: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  motivo: { type: DataTypes.STRING(200), allowNull: true },
  referencia: { type: DataTypes.STRING(120), allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'movimientos',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Producto.hasMany(Movimiento, { foreignKey: 'producto_id', as: 'Movimientos' });
Movimiento.belongsTo(Producto, { foreignKey: 'producto_id', as: 'Producto' });

export const Alerta = sequelize.define('Alerta', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: true },
  titulo: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  tipo: {
    type: DataTypes.ENUM('stock_minimo', 'sin_movimiento', 'vencimiento', 'stock_critico'),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('activa', 'leida', 'resuelta', 'ignorada'),
    allowNull: false,
    defaultValue: 'activa',
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta'),
    allowNull: false,
    defaultValue: 'media',
  },
  metadata: { type: DataTypes.JSONB, allowNull: true },
  fecha_disparo: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_resolucion: { type: DataTypes.DATE, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'alertas',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Producto.hasMany(Alerta, { foreignKey: 'producto_id' });
Alerta.belongsTo(Producto, { foreignKey: 'producto_id' });

Usuario.hasMany(Alerta, { foreignKey: 'usuario_id' });
Alerta.belongsTo(Usuario, { foreignKey: 'usuario_id' });

export const AlertaConfiguracion = sequelize.define('AlertaConfiguracion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: true },
  aplica_todos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  stock_minimo_threshold: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  stock_critico_threshold: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  dias_sin_movimiento: { type: DataTypes.INTEGER, allowNull: true },
  frecuencia_minutos: { type: DataTypes.INTEGER, allowNull: true },
  destinatarios: { type: DataTypes.STRING(500), allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'alertas_configuraciones',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export const ConfiguracionCampo = sequelize.define('ConfiguracionCampo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  etiqueta: { type: DataTypes.STRING(150), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  tipo: {
    type: DataTypes.ENUM(
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
      'texto_largo',
    ),
    allowNull: false,
  },
  aplica_a: {
    type: DataTypes.ENUM('productos', 'categorias', 'proveedores', 'movimientos', 'alertas'),
    allowNull: false,
    defaultValue: 'productos',
  },
  grupo: { type: DataTypes.STRING(120), allowNull: true },
  industria: { type: DataTypes.STRING(120), allowNull: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  placeholder: { type: DataTypes.STRING(200), allowNull: true },
  ayuda: { type: DataTypes.STRING(250), allowNull: true },
  icono: { type: DataTypes.STRING(80), allowNull: true },
  valor_default: { type: DataTypes.STRING(255), allowNull: true },
  opciones: { type: DataTypes.JSONB, allowNull: true },
  validaciones: { type: DataTypes.JSONB, allowNull: true },
  obligatorio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  visible_en_listado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  visible_en_detalle: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'configuracion_campos',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export const TemplateIndustria = sequelize.define('TemplateIndustria', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  codigo: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  industria: { type: DataTypes.STRING(120), allowNull: true },
  color: { type: DataTypes.STRING(20), allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  campos_config: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
}, {
  tableName: 'templates_industria',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Producto.hasOne(AlertaConfiguracion, { foreignKey: 'producto_id', as: 'configuracion_alerta' });
AlertaConfiguracion.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

export const Auditoria = sequelize.define('Auditoria', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tabla: { type: DataTypes.STRING(120), allowNull: false },
  registro_id: { type: DataTypes.STRING(120), allowNull: false },
  accion: { type: DataTypes.STRING(60), allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: true },
  usuario_nombre: { type: DataTypes.STRING(150), allowNull: true },
  usuario_email: { type: DataTypes.STRING(180), allowNull: true },
  valores_anteriores: { type: DataTypes.JSONB, allowNull: true },
  valores_nuevos: { type: DataTypes.JSONB, allowNull: true },
  cambios: { type: DataTypes.JSONB, allowNull: true },
  metadatos: { type: DataTypes.JSONB, allowNull: true },
  ip: { type: DataTypes.STRING(45), allowNull: true },
  user_agent: { type: DataTypes.TEXT, allowNull: true },
  endpoint: { type: DataTypes.STRING(255), allowNull: true },
  metodo_http: { type: DataTypes.STRING(16), allowNull: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  fecha_cambio: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'auditorias',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export { sequelize };
