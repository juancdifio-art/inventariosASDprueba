import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Usuario } from '../../models/index.js';

export const createUser = async ({
  nombre = `Usuario ${Date.now()}`,
  email = `user${Date.now()}@example.com`,
  password = 'Test1234!',
  rol = 'admin',
  activo = true,
} = {}) => {
  const password_hash = await bcrypt.hash(password, 10);
  return Usuario.create({ nombre, email, password_hash, rol, activo });
};

export const signToken = ({ id, email, rol }) => {
  const secret = process.env.JWT_SECRET || 'change_me';
  return jwt.sign({ id, email, rol }, secret, { expiresIn: '1h' });
};
