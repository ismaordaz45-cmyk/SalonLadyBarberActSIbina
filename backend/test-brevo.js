/**
 * Script de diagnóstico para Brevo
 * Ejecuta: node test-brevo.js
 * 
 * Este script prueba la configuración de Brevo y envía un email de prueba
 */

require('dotenv').config();
const SibApiV3Sdk = require('sib-api-v3-sdk');

console.log('\n═══════════════════════════════════════');
console.log('🔍 DIAGNÓSTICO DE BREVO');
console.log('═══════════════════════════════════════\n');

// 1. Verificar variables de entorno
console.log('1️⃣ VERIFICANDO VARIABLES DE ENTORNO');
console.log('─────────────────────────────────────');

const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SIB_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.SIB_SENDER_EMAIL;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME;

console.log('BREVO_API_KEY:', BREVO_API_KEY ? `${BREVO_API_KEY.substring(0, 20)}...` : '❌ NO CONFIGURADA');
console.log('BREVO_SENDER_EMAIL:', BREVO_SENDER_EMAIL || '❌ NO CONFIGURADA');
console.log('BREVO_SENDER_NAME:', BREVO_SENDER_NAME || '❌ NO CONFIGURADA');

if (!BREVO_API_KEY) {
    console.error('\n❌ ERROR: BREVO_API_KEY o SIB_API_KEY no está configurada');
    console.error('💡 Agrega BREVO_API_KEY a tu archivo .env');
    process.exit(1);
}

if (!BREVO_SENDER_EMAIL) {
    console.error('\n⚠️ ADVERTENCIA: BREVO_SENDER_EMAIL no está configurada');
    console.error('💡 Se usará un valor por defecto');
}

// 2. Configurar Brevo
console.log('\n2️⃣ CONFIGURANDO BREVO');
console.log('─────────────────────────────────────');

const cleanApiKey = BREVO_API_KEY.trim();
SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = cleanApiKey;
console.log('✅ API Key configurada');
console.log('📋 Tipo de API Key:', cleanApiKey.startsWith('xsmtpsib-') ? 'SMTP API' : cleanApiKey.startsWith('xkeysib-') ? 'REST API' : 'Desconocido');

// 3. Probar envío de email
console.log('\n3️⃣ PROBANDO ENVÍO DE EMAIL');
console.log('─────────────────────────────────────');

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const senderEmail = BREVO_SENDER_EMAIL || 'noreply@ladybarber.com';
const senderName = BREVO_SENDER_NAME || 'Lady Barber ID\'M';
const testEmail = process.argv[2] || 'test@ejemplo.com'; // Email de prueba

console.log('📧 From:', senderEmail);
console.log('📧 To:', testEmail);
console.log('📧 Name:', senderName);

const sendSmtpEmail = {
    sender: {
        email: senderEmail,
        name: senderName
    },
    to: [{ email: testEmail }],
    subject: "Test de Verificación - Lady Barber ID'M",
    htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Email de Prueba</h2>
            <p>Este es un email de prueba para verificar la configuración de Brevo.</p>
            <p>Si recibes este email, la configuración está correcta.</p>
            <p><strong>Código de prueba: 123456</strong></p>
        </div>
    `
};

apiInstance.sendTransacEmail(sendSmtpEmail)
    .then((response) => {
        console.log('\n✅ EMAIL ENVIADO EXITOSAMENTE');
        console.log('─────────────────────────────────────');
        console.log('📧 Message ID:', response.messageId);
        console.log('📧 Response:', JSON.stringify(response, null, 2));
        console.log('\n💡 Revisa el correo:', testEmail);
        console.log('💡 Si no lo ves, revisa la carpeta de spam');
        console.log('\n═══════════════════════════════════════\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ ERROR AL ENVIAR EMAIL');
        console.error('─────────────────────────────────────');
        console.error('❌ Mensaje:', error.message);
        
        if (error.response) {
            console.error('📋 Status:', error.response.status);
            console.error('📋 Data:', JSON.stringify(error.response.data, null, 2));
            
            // Errores comunes de Brevo
            if (error.response.status === 401) {
                console.error('\n💡 SOLUCIÓN: API Key incorrecta o inválida');
                console.error('   - Verifica que la API key sea correcta');
                console.error('   - Genera una nueva API key en Brevo si es necesario');
            } else if (error.response.status === 400) {
                console.error('\n💡 SOLUCIÓN: Problema con el remitente o destinatario');
                console.error('   - Verifica que el email remitente esté verificado en Brevo');
                console.error('   - Verifica el formato del email destinatario');
            } else if (error.response.status === 403) {
                console.error('\n💡 SOLUCIÓN: Permisos insuficientes');
                console.error('   - Verifica que la API key tenga permisos para enviar emails');
                console.error('   - Verifica que el remitente esté verificado');
            }
        } else if (error.request) {
            console.error('📋 Request:', error.request);
            console.error('\n💡 SOLUCIÓN: No se pudo conectar con Brevo');
            console.error('   - Verifica tu conexión a internet');
        } else {
            console.error('📋 Error:', error);
        }
        
        console.error('\n═══════════════════════════════════════\n');
        process.exit(1);
    });

