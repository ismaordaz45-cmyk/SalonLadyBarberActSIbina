const mongoose = require('mongoose');

// Esquema del usuario basado en la estructura de MySQL que usabas
const usuarioSchema = new mongoose.Schema({
  Nombre: {
    type: String,
    required: true,
    trim: true,
    minlength: 4,
    maxlength: 50
  },
  ApellidoP: {
    type: String,
    required: true,
    trim: true
  },
  ApellidoM: {
    type: String,
    required: true,
    trim: true
  },
  Telefono: {
    type: String,
    required: true,
    match: /^\d{10}$/,
    trim: true
  },
  Correo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor usa un email válido']
  },
  Password: {
    type: String,
    required: true,
    minlength: 8
  },
  PreguntaSecreta: {
    type: String,
    default: ''
  },
  RespuestaSecreta: {
    type: String,
    default: ''
  },
  TipoUsuario: {
    type: String,
    required: true,
    enum: ['Cliente', 'Propietario', 'Administrador', 'Repartidor'],
    default: 'Cliente'
  },
  Estado: {
    type: String,
    enum: ['Activo', 'Inactivo'],
    default: 'Inactivo'
  },
  Metodo2FA: {
    type: String,
    enum: ['Correo', 'SMS', 'App'],
    default: 'Correo'
  },
  VerificacionCodigo: {
    type: String,
    default: null
  },
  VerificacionExpiry: {
    type: Date,
    default: null
  },
  MFACode: {
    type: String,
    default: null
  },
  MFAExpiry: {
    type: Date,
    default: null
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  collection: 'usuarios' // Especifica el nombre de la colección
});

// Índices para mejorar el rendimiento de búsquedas
// Correo ya tiene unique: true en el esquema, así que el índice único se crea automáticamente
// No necesitamos crear un índice explícito para Correo
usuarioSchema.index({ Estado: 1 });
usuarioSchema.index({ TipoUsuario: 1 });  

// Método virtual para verificar si la cuenta está bloqueada
usuarioSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Método para incrementar intentos fallidos y bloquear si es necesario
usuarioSchema.methods.incLoginAttempts = async function() {
  // Si el bloqueo expiró, resetear contador
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.failedAttempts = 1;
    this.lockUntil = null;
    return await this.save();
  }
  
  // Incrementar intentos fallidos
  this.failedAttempts = (this.failedAttempts || 0) + 1;
  
  // Si llegamos a 3 intentos fallidos y no está bloqueado, bloquear por 15 minutos
  if (this.failedAttempts >= 3 && (!this.lockUntil || this.lockUntil < Date.now())) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
  }
  
  return await this.save();
};

// Método para resetear intentos fallidos (cuando login es exitoso)
usuarioSchema.methods.resetLoginAttempts = async function() {
  this.failedAttempts = 0;
  this.lockUntil = null;
  return await this.save();
};

// Método para limpiar datos sensibles antes de enviar
usuarioSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.Password;
  delete userObject.VerificacionCodigo;
  delete userObject.VerificacionExpiry;
  delete userObject.MFACode;
  delete userObject.MFAExpiry;
  delete userObject.failedAttempts;
  delete userObject.lockUntil;
  return userObject;
};

// Crear y exportar el modelo
const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;