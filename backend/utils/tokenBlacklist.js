// 🔐 Sistema de blacklist de tokens JWT para invalidación inmediata al cerrar sesión
// Usa un Map en memoria con limpieza automática de tokens expirados

const tokenBlacklist = new Map(); // token -> { expiresAt: timestamp }

/**
 * Agrega un token a la blacklist hasta su expiración natural
 * @param {string} token - Token JWT a revocar
 * @param {number} expiresInMs - Tiempo hasta expiración en milisegundos (default: 24h)
 */
const addToBlacklist = (token, expiresInMs = 24 * 60 * 60 * 1000) => {
  const expiresAt = Date.now() + expiresInMs;
  tokenBlacklist.set(token, { expiresAt });
  console.log('🔒 Token agregado a blacklist. Expira en:', new Date(expiresAt).toISOString());
  
  // Limpiar automáticamente después de la expiración
  setTimeout(() => {
    tokenBlacklist.delete(token);
    console.log('🧹 Token expirado removido de blacklist');
  }, expiresInMs);
};

/**
 * Verifica si un token está en la blacklist
 * @param {string} token - Token JWT a verificar
 * @returns {boolean} - true si el token está revocado
 */
const isBlacklisted = (token) => {
  if (!token) return false;
  
  const entry = tokenBlacklist.get(token);
  if (!entry) return false;
  
  // Si el token ya expiró, removerlo y considerar que no está blacklisted
  if (Date.now() > entry.expiresAt) {
    tokenBlacklist.delete(token);
    return false;
  }
  
  return true;
};

/**
 * Limpia tokens expirados de la blacklist (ejecutar periódicamente)
 */
const cleanExpiredTokens = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [token, entry] of tokenBlacklist.entries()) {
    if (now > entry.expiresAt) {
      tokenBlacklist.delete(token);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Limpieza automática: ${cleaned} tokens expirados removidos de blacklist`);
  }
  
  return cleaned;
};

// Limpiar tokens expirados cada hora
setInterval(cleanExpiredTokens, 60 * 60 * 1000);

// Limpiar al iniciar el servidor
cleanExpiredTokens();

module.exports = {
  addToBlacklist,
  isBlacklisted,
  cleanExpiredTokens
};

