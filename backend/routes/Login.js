const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');
const { authenticateToken } = require('./auth');
const { addToBlacklist } = require('../utils/tokenBlacklist');
require('dotenv').config();

// Config Gmail SMTP con .env
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;
if (!GMAIL_USER || !GMAIL_APP_PASS) {
  console.warn('⚠️ ADVERTENCIA: GMAIL_USER o GMAIL_APP_PASS no configurados. El envío de MFA por correo fallará.');
} else {
  const transporter = nodemailer.createTransport({  
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASS
    }
  });
  console.log('✅ Gmail configurado para MFA por correo');
}

const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.SIB_SENDER_EMAIL || 'noreply@ladybarber.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Lady Barber ID\'M';

const generateMFACode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Login inicial: Verifica credenciales y envía código MFA
router.post('/', async (req, res) => {
    const { correo, password } = req.body;
    console.log('═══════════════════════════════════════');
    console.log('🔐 INTENTO DE LOGIN');
    console.log('📧 Correo:', correo);
    console.log('═══════════════════════════════════════');

    try {
        // Validación básica de configuración de Gmail
        if (!GMAIL_USER || !GMAIL_APP_PASS) {
            console.error('❌ GMAIL_USER o GMAIL_APP_PASS no configurados');
            return res.status(500).json({ error: 'Error de configuración del servidor. Contacta al administrador.' });
        }

        // Buscar usuario por email
        const usuario = await Usuario.findOne({ Correo: correo });

        if (!usuario) {
            console.log('❌ Usuario no encontrado');
            return res.status(400).json({ error: 'Correo o contraseña incorrectos.' });
        }

        console.log('✅ Usuario encontrado:', {
            id: usuario._id,
            nombre: usuario.Nombre,
            tipo: usuario.TipoUsuario,
            estado: usuario.Estado,
            failedAttempts: usuario.failedAttempts,
            lockUntil: usuario.lockUntil
        });

        // 🔐 Verificar si la cuenta está bloqueada por intentos fallidos
        if (usuario.lockUntil && usuario.lockUntil > Date.now()) {
            const lockMinutes = Math.ceil((usuario.lockUntil - Date.now()) / 60000);
            console.log('🔒 Cuenta bloqueada por intentos fallidos. Tiempo restante:', lockMinutes, 'minutos');
            return res.status(423).json({ 
                error: `Cuenta temporalmente bloqueada debido a múltiples intentos fallidos. Intenta nuevamente en ${lockMinutes} minutos.`,
                lockUntil: usuario.lockUntil,
                retryAfter: Math.ceil((usuario.lockUntil - Date.now()) / 1000) // segundos
            });
        }

        // Verificar si la cuenta está activa
        if (usuario.Estado !== 'Activo') {
            console.log('⚠️ Cuenta no activa:', usuario.Estado);
            return res.status(400).json({ error: 'La cuenta no está verificada. Por favor, verifica tu correo.' });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, usuario.Password);
        if (!isMatch) {
            console.log('❌ Contraseña incorrecta');
            
            // 🔐 Incrementar intentos fallidos y bloquear si es necesario
            await usuario.incLoginAttempts();
            
            // Recargar usuario para obtener el estado actualizado
            const updatedUsuario = await Usuario.findById(usuario._id);
            const remainingAttempts = Math.max(0, 3 - (updatedUsuario.failedAttempts || 0));
            
            let errorMessage = 'Correo o contraseña incorrectos.';
            if (updatedUsuario.lockUntil && updatedUsuario.lockUntil > Date.now()) {
                const lockMinutes = Math.ceil((updatedUsuario.lockUntil - Date.now()) / 60000);
                errorMessage = `Cuenta bloqueada por 3 intentos fallidos. Intenta nuevamente en ${lockMinutes} minutos.`;
            } else if (remainingAttempts > 0) {
                errorMessage = `Correo o contraseña incorrectos. Te quedan ${remainingAttempts} intento(s).`;
            }
            
            return res.status(400).json({ error: errorMessage });
        }

        console.log('✅ Contraseña correcta');

        // 🔐 Resetear intentos fallidos cuando el login es exitoso
        if (usuario.failedAttempts > 0 || usuario.lockUntil) {
            await usuario.resetLoginAttempts();
            console.log('🔄 Intentos fallidos reseteados');
        }

        // Generar código MFA y guardarlo en DB
        const mfaCode = generateMFACode();
        const mfaExpiry = new Date(Date.now() + 10 * 60 * 1000);
        
        usuario.MFACode = mfaCode;
        usuario.MFAExpiry = mfaExpiry;
        await usuario.save();

        console.log('🔢 Código MFA generado:', mfaCode);
        console.log('⏰ Expira en:', mfaExpiry);

        // Enviar correo con código MFA usando Gmail (Nodemailer)
        const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASS
        }
        });

        const mailOptions = {
        from: `${BREVO_SENDER_NAME} <${GMAIL_USER}>`,
        to: usuario.Correo,
        subject: "Código de Verificación MFA - Lady Barber ID'M",
        html: `
            <div style="font-family: 'Geist Sans', Arial, sans-serif; color: #1A252F; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid rgba(44, 62, 80, 0.2); border-radius: 8px; background: #FFFFFF;">
            <h1 style="color: #2C3E50; text-align: center; font-family: 'Playfair Display', serif; font-size: 1.5rem;">Código de Seguridad</h1>
            <p style="font-size: 1rem; text-align: center; line-height: 1.6;">
                Hola <strong>${usuario.Nombre}</strong>, para confirmar tu inicio de sesión ingresa este código:
            </p>
            <div style="background-color: rgba(212, 175, 55, 0.1); padding: 15px; border-radius: 8px; text-align: center;">
                <p style="font-size: 24px; font-weight: 700; color: #D4AF37; margin: 10px 0;">${mfaCode}</p>
                <p style="font-size: 0.875rem; color: rgba(26, 37, 47, 0.6); line-height: 1.4;">Válido por 10 minutos. No compartas este código.</p>
            </div>
            <p style="font-size: 0.75rem; color: rgba(26, 37, 47, 0.6); text-align: center; line-height: 1.4;">
                Si no solicitaste este login, simplemente ignora este correo.
            </p>
            <hr style="border: 0; border-top: 1px solid rgba(44, 62, 80, 0.2); margin-top: 20px;">
            <p style="font-size: 0.75rem; color: rgba(26, 37, 47, 0.6); text-align: center;">
                Lady Barber ID'M<br>© 2025 Todos los derechos reservados.
            </p>
            </div>
        `
        };

        try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email MFA enviado correctamente via Gmail');
        console.log('📧 Message ID:', info.messageId);
        } catch (emailError) {
        console.error('⚠️ Error enviando email MFA via Gmail:', emailError.message);
        // En desarrollo, permitir continuar mostrando el código para pruebas
        if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
            console.warn('🔧 DEV MODE: Devolviendo el código MFA en la respuesta para pruebas locales');
            return res.status(200).json({
            message: 'DEV: No se pudo enviar el correo. Usa el código dev para continuar.',
            userId: usuario._id.toString(),
            email: usuario.Correo,
            devMfaCode: mfaCode
            });
        }
        return res.status(500).json({ error: 'No se pudo enviar el código de verificación. Intenta nuevamente.' });
        }

        console.log('✅ Respuesta enviada al frontend');
        console.log('═══════════════════════════════════════\n');
        
        res.status(200).json({ 
            message: 'Código MFA enviado por correo electrónico. Verifícalo.', 
            userId: usuario._id.toString(),
            email: usuario.Correo
        });
    } catch (error) {
        console.error('💥 ERROR EN LOGIN:', error);
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});

// Verificar MFA y generar token
router.post('/verify-mfa', async (req, res) => {
    const { userId, mfaCode } = req.body;
    
    console.log('\n═══════════════════════════════════════');
    console.log('🔍 VERIFICANDO MFA');
    console.log('👤 UserID recibido:', userId);
    console.log('🔢 Código recibido:', mfaCode);
    console.log('📋 Tipo de userId:', typeof userId);
    console.log('📋 Tipo de mfaCode:', typeof mfaCode);
    console.log('═══════════════════════════════════════');

    try {
        // Validar que se recibieron los datos necesarios
        if (!userId) {
            console.log('❌ UserID no proporcionado');
            return res.status(400).json({ error: 'UserID es requerido.' });
        }

        if (!mfaCode) {
            console.log('❌ Código MFA no proporcionado');
            return res.status(400).json({ error: 'Código MFA es requerido.' });
        }

        // Convertir código a string para comparación consistente
        const codeToVerify = String(mfaCode).trim();

        // Buscar usuario por ID
        const usuario = await Usuario.findById(userId);

        if (!usuario) {
            console.log('❌ Usuario no encontrado con ID:', userId);
            return res.status(400).json({ error: 'Usuario no encontrado.' });
        }
        
        console.log('📋 Datos del usuario:');
        console.log('  - ID:', usuario._id);
        console.log('  - Nombre:', usuario.Nombre);
        console.log('  - Correo:', usuario.Correo);
        console.log('  - TipoUsuario:', usuario.TipoUsuario);
        console.log('  - MFACode en DB:', usuario.MFACode);
        console.log('  - Tipo de MFACode:', typeof usuario.MFACode);
        console.log('  - MFAExpiry:', usuario.MFAExpiry);

        // Verificar código y expiración
        if (!usuario.MFACode) {
            console.log('❌ No hay código MFA en la base de datos');
            return res.status(400).json({ error: 'No hay código MFA pendiente. Solicita un nuevo código.' });
        }

        // Convertir código almacenado a string para comparación
        const storedCode = String(usuario.MFACode).trim();
        
        console.log('🔍 Comparando códigos:');
        console.log('  - Código almacenado:', storedCode, '(tipo:', typeof storedCode, ')');
        console.log('  - Código recibido:', codeToVerify, '(tipo:', typeof codeToVerify, ')');
        console.log('  - Coinciden:', storedCode === codeToVerify);

        if (storedCode !== codeToVerify) {
            console.log('❌ Código MFA no coincide');
            console.log('  Esperado:', storedCode);
            console.log('  Recibido:', codeToVerify);
            return res.status(400).json({ error: 'Código MFA inválido. Verifica que hayas ingresado el código correcto.' });
        }

        // Verificar expiración
        if (!usuario.MFAExpiry) {
            console.log('⚠️ No hay fecha de expiración, pero el código coincide');
        } else {
            const now = new Date();
            const expiry = new Date(usuario.MFAExpiry);
            
            if (now > expiry) {
                console.log('❌ Código MFA expirado');
                console.log('  Ahora:', now);
                console.log('  Expira:', expiry);
                return res.status(400).json({ error: 'Código MFA expirado. Solicita un nuevo código.' });
            }
        }

        console.log('✅ Código MFA válido');

        // Verificar que JWT_SECRET esté configurado
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET no está configurado en .env');
            return res.status(500).json({ error: 'Error de configuración del servidor. Contacta al administrador.' });
        }

        // Limpiar MFA después de uso
        usuario.MFACode = null;
        usuario.MFAExpiry = null;
        await usuario.save();
        console.log('🧹 Código MFA limpiado de la base de datos');

        // Generar JWT
        try {
            const token = jwt.sign(
                { 
                    id: usuario._id.toString(), 
                    correo: usuario.Correo, 
                    tipo: usuario.TipoUsuario 
                },
                process.env.JWT_SECRET,
                { 
                    algorithm: 'HS256',  // Algoritmo explícito
                    expiresIn: '24h'     // Expiración definida
                }
            );

            console.log('🎫 Token JWT generado exitosamente');

            // Preparar respuesta con TODOS los datos del usuario
            const responseData = {
                message: 'Login exitoso.',
                token: token,
                user: {
                    id_usuarios: usuario._id.toString(),
                    nombre: usuario.Nombre, // Minúscula para compatibilidad con frontend
                    Nombre: usuario.Nombre, // Mayúscula original
                    ApellidoP: usuario.ApellidoP,
                    ApellidoM: usuario.ApellidoM,
                    correo: usuario.Correo, // Minúscula para compatibilidad
                    Correo: usuario.Correo, // Mayúscula original
                    Telefono: usuario.Telefono,
                    PreguntaSecreta: usuario.PreguntaSecreta,
                    RespuestaSecreta: usuario.RespuestaSecreta,
                    TipoUsuario: usuario.TipoUsuario,
                    tipo: usuario.TipoUsuario // Mantener compatibilidad
                }
            };

            console.log('📤 DATOS QUE SE ENVÍAN AL FRONTEND:');
            console.log(JSON.stringify(responseData, null, 2));
            console.log('═══════════════════════════════════════\n');

            res.status(200).json(responseData);
        } catch (jwtError) {
            console.error('❌ Error generando JWT:', jwtError);
            return res.status(500).json({ error: 'Error al generar token de autenticación.' });
        }
        
    } catch (error) {
        console.error('\n💥 ERROR VERIFICANDO MFA');
        console.error('═══════════════════════════════════════');
        console.error('❌ Error:', error.message);
        console.error('📋 Stack:', error.stack);
        console.error('📋 Nombre:', error.name);
        if (error.errors) {
            console.error('📋 Errores de validación:', error.errors);
        }
        console.error('═══════════════════════════════════════\n');
        
        // Enviar mensaje de error más descriptivo
        const errorMessage = error.message || 'Error en el servidor al verificar el código.';
        res.status(500).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Google Auth (POST /api/login/auth/google)
router.post('/auth/google', async (req, res) => {
  const { token } = req.body;
  console.log('🔐 Google Auth iniciado - Token recibido');

  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_BACKEND);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID_BACKEND,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Busca o crea usuario
    let usuario = await Usuario.findOne({ Correo: email });
    if (!usuario) {
      usuario = new Usuario({
        Nombre: name,
        Correo: email,
        ApellidoP: 'Google',
        ApellidoM: '',
        Telefono: '',
        Estado: 'Activo',
        TipoUsuario: 'Cliente',
        Password: 'google-auth',  // No usas password para Google
        PreguntaSecreta: '',
        RespuestaSecreta: '',
      });
      await usuario.save();
      console.log('👤 Usuario Google creado:', email);
    } else {
      console.log('👤 Usuario Google existente:', email);
    }

    // Genera JWT
    const jwtToken = jwt.sign(
      { id: usuario._id, correo: email, tipo: usuario.TipoUsuario },
      process.env.JWT_SECRET,
      { 
        algorithm: 'HS256',  // Algoritmo explícito
        expiresIn: '24h'     // Expiración definida
      }
    );

    console.log('✅ Google Auth exitoso - Token JWT generado');

    // Preparar respuesta con TODOS los datos del usuario (compatibilidad con frontend)
    res.json({ 
      token: jwtToken, 
      user: {
        id_usuarios: usuario._id.toString(),
        nombre: usuario.Nombre,  // Minúscula para compatibilidad
        Nombre: usuario.Nombre,
        ApellidoP: usuario.ApellidoP,
        ApellidoM: usuario.ApellidoM,
        correo: usuario.Correo,  // Minúscula para compatibilidad
        Correo: usuario.Correo,
        Telefono: usuario.Telefono,
        PreguntaSecreta: usuario.PreguntaSecreta,
        RespuestaSecreta: usuario.RespuestaSecreta,
        TipoUsuario: usuario.TipoUsuario,
        tipo: usuario.TipoUsuario  // Mantener compatibilidad
      } 
    });
  } catch (error) {
    console.error('❌ Error Google Auth:', error.message);
    res.status(500).json({ error: 'Error en autenticación Google. Intenta de nuevo.' });
  }
});

/**
 * Endpoint de diagnóstico opcional (solo desarrollo)
 * Envía un correo de prueba con un código estático para validar Gmail rápidamente
 * POST /api/login/test-email { correo: string }
 */
// Descomentar si necesitas probar aislado el envío de email
router.post('/test-email', async (req, res) => {
   const { correo } = req.body;
   if (!correo) return res.status(400).json({ error: 'Correo requerido' });
   const transporter = nodemailer.createTransport({  // ✅ Corregido: "createTransport"
     service: 'gmail',
     auth: {
       user: GMAIL_USER,
       pass: GMAIL_APP_PASS
     }
   });
   const testCode = '123456';
   const mailOptions = {
     from: `${BREVO_SENDER_NAME} <${GMAIL_USER}>`,
     to: correo,
     subject: "Prueba de Envío - Lady Barber ID'M",
     html: `<p>Código de prueba: <strong>${testCode}</strong></p>`
   };
   try {
     const info = await transporter.sendMail(mailOptions);
     return res.status(200).json({ message: 'Email de prueba enviado via Gmail', code: testCode, id: info.messageId });
   } catch (e) {
     console.error('Error test-email:', e.message);
     return res.status(500).json({ error: 'Fallo al enviar email de prueba', details: e.message });
  }
});

// 🔐 Endpoint de logout: invalida el token inmediatamente
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(400).json({ error: 'Token no proporcionado.' });
    }

    // Decodificar token para obtener expiración
    let decoded;
    try {
      decoded = jwt.decode(token); // Solo decodificar, no verificar (puede estar expirado)
    } catch (error) {
      console.error('Error decodificando token:', error);
      return res.status(400).json({ error: 'Token inválido.' });
    }

    // Calcular tiempo hasta expiración
    const expiresInMs = decoded.exp ? (decoded.exp * 1000 - Date.now()) : 24 * 60 * 60 * 1000;

    // Agregar token a blacklist
    addToBlacklist(token, Math.max(expiresInMs, 0));

    console.log('🚪 Logout exitoso. Token invalidado para usuario:', req.user.Correo);

    res.status(200).json({ 
      message: 'Sesión cerrada exitosamente. El token ha sido invalidado.' 
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión.' });
  }
});

module.exports = router;
/**
 * Endpoint de diagnóstico opcional (solo desarrollo)
 * Envía un correo de prueba con un código estático para validar Gmail rápidamente
 * POST /api/login/test-email { correo: string }
 */
// Descomentar si necesitas probar aislado el envío de email
router.post('/test-email', async (req, res) => {
   const { correo } = req.body;
   if (!correo) return res.status(400).json({ error: 'Correo requerido' });
   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: {
       user: GMAIL_USER,
       pass: GMAIL_APP_PASS
     }
   });
   const testCode = '123456';
   const mailOptions = {
     from: `${BREVO_SENDER_NAME} <${GMAIL_USER}>`,
     to: correo,
     subject: "Prueba de Envío - Lady Barber ID'M",
     html: `<p>Código de prueba: <strong>${testCode}</strong></p>`
   };
   try {
     const info = await transporter.sendMail(mailOptions);
     return res.status(200).json({ message: 'Email de prueba enviado via Gmail', code: testCode, id: info.messageId });
   } catch (e) {
     console.error('Error test-email:', e.message);
     return res.status(500).json({ error: 'Fallo al enviar email de prueba', details: e.message });
   }
 });
