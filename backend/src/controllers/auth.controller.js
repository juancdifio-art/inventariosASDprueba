import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/index.js';

const signToken = (user) => {
  const payload = { id: user.id, email: user.email, rol: user.rol };
  const secret = process.env.JWT_SECRET || 'change_me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(payload, secret, { expiresIn });
};

export const register = async (req, res) => {
  try {
    const { nombre, email, password, rol = 'usuario' } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }
    const exists = await Usuario.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email ya registrado' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await Usuario.create({ nombre, email, password_hash, rol, activo: true });
    const token = signToken(user);
    return res.status(201).json({ success: true, message: 'Registro exitoso', data: { token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, activo: user.activo } } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al registrar', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Credenciales incompletas' });
    }
    const user = await Usuario.findOne({ where: { email } });
    if (!user || !user.activo) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    const token = signToken(user);
    return res.json({ success: true, message: 'Login exitoso', data: { token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, activo: user.activo } } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};

export const me = async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.user.id, { attributes: ['id', 'nombre', 'email', 'rol', 'activo'] });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener perfil', error: { type: 'INTERNAL_ERROR', details: err.message } });
  }
};
