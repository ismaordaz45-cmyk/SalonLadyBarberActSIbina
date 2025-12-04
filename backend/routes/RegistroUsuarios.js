const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');
require('dotenv').config();

// Config Gmail SMTP con .env
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;
if (!GMAIL_USER || !GMAIL_APP_PASS) {
  console.warn('⚠️ ADVERTENCIA: GMAIL_USER o GMAIL_APP_PASS no configurados. El envío de verificación por correo fallará.');
} else {
  console.log('✅ Gmail configurado para envío de correos de verificación');
}

const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Lady Barber ID\'M';

// Generar código de verificación de 6 dígitos
const generateVerificationCode = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

// Enviar email de verificación de cuenta usando Gmail (Nodemailer)
const sendVerificationEmail = async (usuario) => {
    if (!GMAIL_USER || !GMAIL_APP_PASS) {
        console.warn('⚠️ No se envió email de verificación porque GMAIL_USER o GMAIL_APP_PASS no están configurados.');
        return null;
    }

    const verificationCode = usuario.VerificacionCodigo;

    // Crear transporter de Gmail
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
        subject: "Verifica tu cuenta - Lady Barber ID'M",
        html: `
            <div style="font-family: 'Geist Sans', Arial, sans-serif; color: #1A252F; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid rgba(44, 62, 80, 0.2); border-radius: 8px; background: #FFFFFF;">
              <h1 style="color: #2C3E50; text-align: center; font-family: 'Playfair Display', serif; font-size: 1.5rem;">Verifica tu cuenta</h1>
              <p style="font-size: 1rem; line-height: 1.6; text-align: center;">
                Hola <strong>${usuario.Nombre}</strong>, gracias por registrarte en <strong>Lady Barber ID'M</strong>.
              </p>
              <p style="font-size: 1rem; line-height: 1.6; text-align: center;">
                Para activar tu cuenta, introduce el siguiente código de verificación en la pantalla de <strong>Verificar Correo</strong>:
              </p>
              <div style="background-color: rgba(212, 175, 55, 0.1); padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="font-size: 24px; font-weight: 700; color: #D4AF37; margin: 10px 0;">${verificationCode}</p>
                <p style="font-size: 0.875rem; color: rgba(26, 37, 47, 0.6); line-height: 1.4;">
                  Este código es válido por <strong>10 minutos</strong>. No lo compartas con nadie.
                </p>
              </div>
              <p style="font-size: 0.9rem; line-height: 1.6; text-align: center;">
                Si tú no solicitaste esta cuenta, puedes ignorar este mensaje.
              </p>
              <hr style="border: 0; border-top: 1px solid rgba(44, 62, 80, 0.2); margin-top: 20px;">
              <p style="font-size: 0.75rem; color: rgba(26, 37, 47, 0.6); text-align: center;">
                Lady Barber ID'M<br />© 2025 Todos los derechos reservados.
              </p>
            </div>
        `
    };

    console.log('═══════════════════════════════════════');
    console.log('📧 ENVIANDO EMAIL DE VERIFICACIÓN');
    console.log('📧 Destinatario:', usuario.Correo);
    console.log('🔢 Código generado:', verificationCode);
    console.log('═══════════════════════════════════════');

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de verificación enviado correctamente via Gmail');
        console.log('📧 Message ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error enviando email de verificación via Gmail:', error.message);
        throw error;
    }
};

// Crear (Registrar Usuario) con verificación de correo
router.post('/', async (req, res) => {
    const { nombre, apellidopa, apellidoma, correo, telefono, password, tipousuario, preguntaSecreta, respuestaSecreta } = req.body;
    console.log('Datos recibidos:', { nombre, apellidopa, apellidoma, correo, telefono, password, tipousuario, preguntaSecreta, respuestaSecreta });

    try {
        // Validar el formato del correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            console.log('Correo inválido:', correo);
            return res.status(400).json({ error: 'El correo electrónico no tiene un formato válido.' });
        }

        // Verificar si el correo ya existe
        const existingUser = await Usuario.findOne({ Correo: correo });

        if (existingUser) {
            console.log('Correo ya registrado:', correo);
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Validar y establecer tipousuario
        let validTipousuario = tipousuario;
        if (!tipousuario || !['Cliente', 'Propietario'].includes(tipousuario)) {
            console.log('Tipo de usuario inválido o no proporcionado, usando Cliente por defecto:', tipousuario);
            validTipousuario = 'Cliente'; // Valor por defecto si no se proporciona o es inválido
        }

        // Pregunta y respuesta secreta: si no se proporcionan, usar vacío
        const preguntaSecretaFinal = preguntaSecreta || '';
        const respuestaSecretaFinal = respuestaSecreta || '';

        // 🔐 Hash de la respuesta secreta con bcrypt (como la contraseña)
        let hashedRespuestaSecreta = '';
        if (respuestaSecretaFinal && respuestaSecretaFinal.trim().length > 0) {
            hashedRespuestaSecreta = await bcrypt.hash(respuestaSecretaFinal.trim(), 10);
        }

        // Generar código de verificación y fecha de expiración (10 minutos)
        const verificationCode = generateVerificationCode();
        const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Crear nuevo usuario en MongoDB con estado INACTIVO hasta que verifique su correo
        const nuevoUsuario = new Usuario({
            Nombre: nombre,
            ApellidoP: apellidopa,
            ApellidoM: apellidoma,
            Telefono: telefono,
            Correo: correo,
            Password: hashedPassword,
            PreguntaSecreta: preguntaSecretaFinal,
            RespuestaSecreta: hashedRespuestaSecreta,
            TipoUsuario: validTipousuario,
            Estado: 'Inactivo', // 🔐 No puede iniciar sesión hasta verificar el correo
            Metodo2FA: 'Correo',
            VerificacionCodigo: verificationCode,
            VerificacionExpiry: verificationExpiry,
        });

        await nuevoUsuario.save();
        console.log('Usuario insertado exitosamente. Estado inicial: Inactivo. TipoUsuario:', validTipousuario);

        // Validar que Gmail esté configurado antes de intentar enviar
        if (!GMAIL_USER || !GMAIL_APP_PASS) {
            console.error('❌ GMAIL_USER o GMAIL_APP_PASS no configurados');
            if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
                console.warn('🔧 DEV MODE: Devolviendo el código de verificación en la respuesta para pruebas locales');
                return res.status(201).json({
                    message: 'Usuario registrado. No se pudo enviar el correo de verificación, usa el código dev para verificar tu cuenta.',
                    email: correo,
                    verificationCode: verificationCode,
                });
            }
            return res.status(500).json({
                error: 'Error de configuración del servidor. Contacta al administrador.',
            });
        }

        try {
            await sendVerificationEmail(nuevoUsuario);
        } catch (emailError) {
            console.error('❌ Error al enviar el email de verificación:', emailError.message);

            if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
                console.warn('🔧 DEV MODE: Devolviendo el código de verificación en la respuesta para pruebas locales');
                return res.status(201).json({
                    message: 'Usuario registrado. No se pudo enviar el correo de verificación, usa el código dev para verificar tu cuenta.',
                    email: correo,
                    verificationCode: verificationCode,
                });
            }

            return res.status(500).json({
                error: 'Usuario registrado, pero hubo un problema al enviar el correo de verificación. Por favor, intenta más tarde.',
            });
        }

        res.status(201).json({
            message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta antes de iniciar sesión.',
            email: correo,
        });
    } catch (error) {
        console.error('💥 Error al registrar el usuario:', error);
        console.error('📋 Stack completo:', error.stack);
        console.error('📋 Nombre del error:', error.name);
        if (error.errors) {
            console.error('📋 Errores de validación:', error.errors);
        }
        res.status(500).json({ error: 'Error al registrar el usuario', details: error.message });
    }
});

// Verificar código de correo electrónico y activar cuenta
router.get('/verify/:code', async (req, res) => {
    const { code } = req.params;

    console.log('═══════════════════════════════════════');
    console.log('🔍 VERIFICANDO CÓDIGO DE CORREO');
    console.log('🔢 Código recibido:', code);
    console.log('═══════════════════════════════════════');

    try {
        if (!code || String(code).trim().length !== 6) {
            return res.status(400).json({ error: 'Código de verificación inválido.' });
        }

        const verificationCode = String(code).trim();

        const usuario = await Usuario.findOne({ VerificacionCodigo: verificationCode });

        if (!usuario) {
            console.log('❌ Código de verificación no encontrado:', verificationCode);
            return res.status(400).json({ error: 'Código de verificación inválido.' });
        }

        if (!usuario.VerificacionExpiry) {
            console.log('⚠️ Usuario sin fecha de expiración, pero con código.');
        } else {
            const now = new Date();
            const expiry = new Date(usuario.VerificacionExpiry);

            if (now > expiry) {
                console.log('❌ Código de verificación expirado');
                console.log('  Ahora:', now);
                console.log('  Expiró:', expiry);
                return res.status(400).json({ error: 'El código de verificación ha expirado. Solicita uno nuevo.' });
            }
        }

        // Activar cuenta y limpiar código
        usuario.Estado = 'Activo';
        usuario.VerificacionCodigo = null;
        usuario.VerificacionExpiry = null;
        await usuario.save();

        console.log('✅ Cuenta verificada correctamente para:', usuario.Correo);
        console.log('═══════════════════════════════════════');

        return res.status(200).json({
            message: 'Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.',
            email: usuario.Correo,
        });
    } catch (error) {
        console.error('💥 Error al verificar el código de correo:', error);
        return res.status(500).json({ error: 'Error al verificar el código de correo.', details: error.message });
    }
});

// Reenviar código de verificación de correo
router.post('/resend-code', async (req, res) => {
    const { correo } = req.body;

    console.log('═══════════════════════════════════════');
    console.log('🔄 REENVÍO DE CÓDIGO DE VERIFICACIÓN');
    console.log('📧 Correo:', correo);
    console.log('═══════════════════════════════════════');

    try {
        if (!correo) {
            return res.status(400).json({ error: 'El correo electrónico es requerido.' });
        }

        const usuario = await Usuario.findOne({ Correo: correo });

        if (!usuario) {
            console.log('❌ Usuario no encontrado para reenviar código:', correo);
            return res.status(400).json({ error: 'No existe una cuenta registrada con ese correo.' });
        }

        if (usuario.Estado === 'Activo') {
            console.log('ℹ️ Usuario ya verificado, no es necesario reenviar código:', correo);
            return res.status(400).json({ error: 'Esta cuenta ya está verificada. Puedes iniciar sesión.' });
        }

        // Validar que Gmail esté configurado antes de intentar reenviar
        if (!GMAIL_USER || !GMAIL_APP_PASS) {
            console.error('❌ GMAIL_USER o GMAIL_APP_PASS no configurados');
            return res.status(500).json({
                error: 'Error de configuración del servidor. Contacta al administrador.',
            });
        }

        // Generar nuevo código y actualizar expiración
        const newCode = generateVerificationCode();
        const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

        usuario.VerificacionCodigo = newCode;
        usuario.VerificacionExpiry = newExpiry;
        await usuario.save();

        try {
            await sendVerificationEmail(usuario);
        } catch (emailError) {
            console.error('❌ Error al reenviar el email de verificación:', emailError.message);

            if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
                console.warn('🔧 DEV MODE: Devolviendo el nuevo código de verificación en la respuesta para pruebas locales');
                return res.status(200).json({
                    message: 'Se generó un nuevo código, pero no se pudo enviar el correo. Usa el código dev para verificar tu cuenta.',
                    email: correo,
                    verificationCode: newCode,
                });
            }

            return res.status(500).json({
                error: 'No se pudo reenviar el correo de verificación. Intenta nuevamente más tarde.',
            });
        }

        console.log('✅ Nuevo código de verificación reenviado a:', correo);
        console.log('═══════════════════════════════════════');

        return res.status(200).json({
            message: 'Se ha enviado un nuevo código de verificación a tu correo.',
            email: correo,
        });
    } catch (error) {
        console.error('💥 Error al reenviar el código de verificación:', error);
        return res.status(500).json({ error: 'Error al reenviar el código de verificación.', details: error.message });
    }
});

module.exports = router;