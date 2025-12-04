const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config(); // Carga las variables de .env

// URI de conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ladybarber_db';

// Conexión a MongoDB usando Mongoose
const connectDB = async () => {
  try {
    // Opciones de conexión para MongoDB Atlas
    const options = {
      // Opciones recomendadas para Atlas
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
    };

    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ ¡Conexión exitosa a MongoDB Atlas!');
    console.log('📊 Base de datos:', mongoose.connection.name);
    console.log('🌐 Cluster:', mongoose.connection.host);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB Atlas:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Verifica que:');
      console.error('   1. Tu IP esté en la whitelist de MongoDB Atlas');
      console.error('   2. Las credenciales sean correctas');
      console.error('   3. El cluster esté activo');
    }
    process.exit(1); // Salir del proceso si no puede conectar
  }
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🔌 Mongoose conectado a la base de datos');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado');
});

// Exportar la función de conexión y mongoose
module.exports = { connectDB, mongoose };
