const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const Usuario = require('../models/Usuario');
require('dotenv').config();

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Lady Barber ID\'M';

const generateMFACode = () => Math.floor(100000 + Math.random() * 900000).toString();

// 🔐 Rate Limiter: Máximo 3 intentos de recuperación por 15 minutos
const recoveryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // Máximo 3 intentos por ventana de tiempo
  message: {
    error: 'Demasiados intentos de recuperación. Por favor, espera 15 minutos antes de intentar nuevamente.',
    retryAfter: 15 * 60 // Segundos hasta poder intentar de nuevo
  },
  standardHeaders: true, // Retorna información de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Desactiva headers `X-RateLimit-*`
  skipSuccessfulRequests: false, // Cuenta todos los requests, incluso los exitosos
  handler: (req, res) => {
    console.log('⚠️ Rate limit excedido para recovery:', req.ip);
    res.status(429).json({
      error: 'Demasiados intentos de recuperación. Por favor, espera 15 minutos antes de intentar nuevamente.',
      retryAfter: 15 * 60
    });
  }
});

// Paso 1: Enviar código de reset por email (con rate limiting)
router.post('/', recoveryRateLimiter, async (req, res) => {
  const { correo } = req.body;
  console.log('═══════════════════════════════════════');
  console.log('🔄 INTENTO DE RECOVERY - Email:', correo);
  console.log('═══════════════════════════════════════');

  try {
    if (!GMAIL_USER || !GMAIL_APP_PASS) {
      return res.status(500).json({ error: 'Error de configuración del servidor.' });
    }

    const usuario = await Usuario.findOne({ Correo: correo });

    // 🔐 SEGURIDAD: Siempre responder con el mismo mensaje genérico
    // para prevenir enumeración de usuarios (no revelar si el correo existe o no)
    const genericMessage = 'Si el correo está registrado, recibirás un código de recuperación. Revisa tu bandeja de entrada.';

    if (!usuario) {
      // Usuario no existe, pero respondemos igual para no revelar información
      console.log('⚠️ Correo no encontrado, pero respondiendo con mensaje genérico por seguridad');
      // Simulamos un pequeño delay para que el tiempo de respuesta sea similar
      await new Promise(resolve => setTimeout(resolve, 500));
      return res.status(200).json({ 
        message: genericMessage
      });
    }

    // Generar y guardar código solo si el usuario existe
    const resetCode = generateMFACode();
    const resetExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    usuario.MFACode = resetCode;  // Reutilizamos MFACode para reset
    usuario.MFAExpiry = resetExpiry;
    await usuario.save();

    console.log('🔢 Código reset generado:', resetCode);

    // Enviar email solo si el usuario existe
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS }
    });

    const mailOptions = {
      from: `${BREVO_SENDER_NAME} <${GMAIL_USER}>`,
      to: correo,
      subject: "Código de Recuperación - Lady Barber ID'M",
      html: `
        <div style="font-family: 'Geist Sans', Arial, sans-serif; color: #1A252F; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid rgba(44, 62, 80, 0.2); border-radius: 8px; background: #FFFFFF;">
          <h1 style="color: #2C3E50; text-align: center; font-family: 'Playfair Display', serif; font-size: 1.5rem;">Recuperar Contraseña</h1>
          <p style="font-size: 1rem; text-align: center; line-height: 1.6;">
            Hola <strong>${usuario.Nombre}</strong>, usa este código para restablecer tu contraseña:
          </p>
          <div style="background-color: rgba(212, 175, 55, 0.1); padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #D4AF37; margin: 10px 0;">${resetCode}</p>
            <p style="font-size: 0.875rem; color: rgba(26, 37, 47, 0.6); line-height: 1.4;">Válido por 10 minutos.</p>
          </div>
          <p style="font-size: 0.75rem; color: rgba(26, 37, 47, 0.6); text-align: center; line-height: 1.4;">
            Si no solicitaste esto, ignora el correo.
          </p>
          <hr style="border: 0; border-top: 1px solid rgba(44, 62, 80, 0.2); margin-top: 20px;">
          <p style="font-size: 0.75rem; color: rgba(26, 37, 47, 0.6); text-align: center;">
            Lady Barber ID'M © 2025.
          </p>
        </div>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Email de recovery enviado:', info.messageId);
    } catch (emailError) {
      console.error('❌ Error enviando email de recovery:', emailError.message);
      // Aún así respondemos con mensaje genérico para no revelar información
    }

    // DEV mode: mostrar código
    if (process.env.NODE_ENV !== 'production') {
      console.warn('🔧 DEV: Código en logs:', resetCode);
    }

    // 🔐 Siempre responder con mensaje genérico (incluso si el email falló)
    res.status(200).json({ 
      message: genericMessage
    });
  } catch (error) {
    console.error('💥 ERROR EN RECOVERY:', error);
    if (process.env.NODE_ENV !== 'production') {
      res.status(200).json({ message: 'DEV: Error email, usa código de logs.', userId: null, devResetCode: '123456' });
    } else {
      res.status(500).json({ error: 'Error al enviar código.' });
    }
  }
});

// Paso 2: Verificar solo el código (sin cambiar password aún)
router.post('/verify-code', async (req, res) => {
  const { correo, resetCode } = req.body;
  
  console.log('🔍 VERIFICANDO CÓDIGO - Correo:', correo, 'Código:', resetCode);

  try {
    if (!correo || !resetCode) {
      return res.status(400).json({ error: 'Datos requeridos.' });
    }

    const usuario = await Usuario.findOne({ Correo: correo });

    if (!usuario) {
      console.log('⚠️ Usuario no encontrado o código inválido (no se revela cuál)');
      return res.status(400).json({ error: 'Código inválido o expirado. Solicita un nuevo código.' });
    }

    const codeToVerify = String(resetCode).trim();
    const storedCode = usuario.MFACode ? String(usuario.MFACode).trim() : null;

    if (!storedCode || storedCode !== codeToVerify) {
      console.log('⚠️ Código no coincide o no existe');
      return res.status(400).json({ error: 'Código inválido o expirado. Solicita un nuevo código.' });
    }

    const now = new Date();
    const expiry = usuario.MFAExpiry ? new Date(usuario.MFAExpiry) : null;
    if (!expiry || now > expiry) {
      console.log('⚠️ Código expirado');
      return res.status(400).json({ error: 'Código inválido o expirado. Solicita un nuevo código.' });
    }

    console.log('✅ Código de recuperación válido para:', usuario.Correo);
    return res.status(200).json({ success: true, message: 'Código válido. Ahora puedes ingresar tu nueva contraseña.' });
  } catch (error) {
    console.error('💥 ERROR VERIFICANDO CÓDIGO:', error);
    return res.status(500).json({ error: 'Error al verificar el código.' });
  }
});

// Paso 3: Verificar código y actualizar password
router.post('/verify', async (req, res) => {
  const { correo, resetCode, newPassword } = req.body;
  
  console.log('🔍 VERIFICANDO RESET - Correo:', correo, 'Código:', resetCode);

  try {
    if (!correo || !resetCode || !newPassword) {
      return res.status(400).json({ error: 'Datos requeridos.' });
    }

    // Buscar usuario por correo
    const usuario = await Usuario.findOne({ Correo: correo });

    // 🔐 SEGURIDAD: Mensaje genérico si el usuario no existe o el código no coincide
    // No revelamos si el correo existe o si el código es incorrecto específicamente
    if (!usuario) {
      console.log('⚠️ Usuario no encontrado o código inválido (no se revela cuál)');
      return res.status(400).json({ error: 'Código inválido o expirado. Solicita un nuevo código.' });
    }

    const codeToVerify = String(resetCode).trim();
    const storedCode = usuario.MFACode ? String(usuario.MFACode).trim() : null;

    if (!storedCode || storedCode !== codeToVerify) {
      console.log('⚠️ Código no coincide o no existe');
      return res.status(400).json({ error: 'Código inválido o expirado. Solicita un nuevo código.' });
    }

    const now = new Date();
    const expiry = usuario.MFAExpiry ? new Date(usuario.MFAExpiry) : null;
    if (!expiry || now > expiry) {
      console.log('⚠️ Código expirado');
      return res.status(400).json({ error: 'Código inválido o expirado. Solicita un nuevo código.' });
    }

    // Hash nueva password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    usuario.Password = hashedPassword;
    usuario.MFACode = null;
    usuario.MFAExpiry = null;
    await usuario.save();

    console.log('✅ Password actualizada para:', usuario.Correo);

    res.status(200).json({ success: true, message: 'Contraseña actualizada.' });
  } catch (error) {
    console.error('💥 ERROR VERIFICANDO RESET:', error);
    res.status(500).json({ error: 'Error al actualizar contraseña.' });
  }
});

module.exports = router;