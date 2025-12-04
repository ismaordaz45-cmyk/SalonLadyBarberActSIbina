const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./db'); // Importa la función de conexión

dotenv.config(); // Carga .env

const app = express();
const PORT = process.env.PORT || 3000;

// Log de entorno para confirmar modo local
console.log(`🛠️ Modo: ${process.env.NODE_ENV || 'development'}`);  // ← Nuevo: Confirma local

// Middleware básico
app.use(express.json());

// Seguridad HTTP: cabeceras por defecto (CSP básica, X-Frame-Options, etc.)
app.use(helmet());

// CORS: Permite requests desde varios puertos (desarrollo y prod)
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Importar las rutas
const RegistroUsuarios = require('./routes/RegistroUsuarios.js');
const Login = require('./routes/Login.js');

// Importar middleware de auth
const { authenticateToken } = require('./routes/auth');

// Rutas públicas (no requieren token)
app.use('/api/registro', RegistroUsuarios);
app.use('/api/login', Login);
// ... otros requires
app.use('/api/recovery', require('./routes/recovery'));  // ← Nuevo

// Rutas protegidas (ejemplo, si las tienes)
// app.use('/api/protected', authenticateToken, protectedRoutes);

// Manejo de errores global (opcional, para mejor logging)
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos primero
    await connectDB();
    
    // Iniciar el servidor después de conectar a la DB
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n⏳ Cerrando servidor...');
  process.exit(0);
});

// Iniciar todo
startServer();