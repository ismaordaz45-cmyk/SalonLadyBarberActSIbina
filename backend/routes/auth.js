// middleware/auth.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { isBlacklisted } = require('../utils/tokenBlacklist');

// Autenticación básica con JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token requerido.' });
  }

  try {
    // 🔐 Verificar si el token está en la blacklist (revocado)
    if (isBlacklisted(token)) {
      console.warn('🚫 Token revocado detectado en blacklist');
      return res.status(401).json({ error: 'Token revocado. Por favor, inicia sesión nuevamente.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findOne({ 
      _id: decoded.id, 
      Estado: 'Activo' 
    });
    
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no válido o inactivo.' });
    }
    
    req.user = usuario; // Adjunta usuario al req
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(403).json({ error: 'Token inválido.' });
  }
};

// 🔐 Middleware de autorización por rol (RBAC)
// Uso: router.get('/admin', authenticateToken, authorizeRoles('Administrador'), handler)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    const userRole = req.user.TipoUsuario;

    if (!allowedRoles.includes(userRole)) {
      console.warn('🚫 Acceso denegado por rol:', {
        required: allowedRoles,
        actual: userRole,
        userId: req.user._id.toString(),
      });
      return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso.' });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
