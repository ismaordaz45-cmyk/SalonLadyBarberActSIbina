import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";  // ← Cambia useNavigate por esto si ya lo tenías solo con useNavigate
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import { GoogleLogin } from '@react-oauth/google'; // Añadido para Google Auth
import { useAuth } from '../Autenticacion/AuthContext';
import DOMPurify from "dompurify";

// Material UI Components
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  alpha,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Security,
  ArrowBack,
  PersonAdd,
  Email as EmailIcon, // Ícono para MFA por correo
  PersonOutline,      // Nuevo ícono para encabezado de Iniciar Sesión
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

const MySwal = withReactContent(Swal);
const API_BASE_URL = "http://localhost:3000";

// 🔐 Sanitizador de entrada para prevenir XSS
const sanitizeInput = (value) =>
  DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();

// Motion Components
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    correo: "",
    password: "",
    userId: "",
    mfaCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
    console.log('🚀 Componente Login montado');
    console.log('📍 Ubicación actual:', window.location.pathname);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 🔐 Sanitizar inputs susceptibles de XSS (texto libre)
    let sanitizedValue = value;
    if (["correo", "mfaCode"].includes(name)) {
      sanitizedValue = sanitizeInput(value);
    }
    // Password no se sanitiza porque puede contener caracteres especiales válidos

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    setError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log('\n═══════════════════════════════════════');
    console.log('📝 PASO 1: ENVIANDO CREDENCIALES');
    console.log('═══════════════════════════════════════');

    if (!formData.correo || !formData.password) {
      MySwal.fire({
        icon: "error",
        title: "Campos requeridos",
        text: "Ingresa tu correo y contraseña.",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('📤 Enviando a:', `${API_BASE_URL}/api/login`);
      console.log('📧 Correo:', formData.correo);
      
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        correo: formData.correo,
        password: formData.password,
      });

      console.log('📥 Respuesta recibida:', response.data);

      if (response.data.userId) {
        console.log('✅ UserId recibido:', response.data.userId);
        setFormData((prev) => ({ ...prev, userId: response.data.userId }));
        setStep(2);
        console.log('🔄 Avanzando a paso 2 (MFA)');
        
        MySwal.fire({
          icon: "info",
          title: "Código enviado",
          text: "Revisa tu correo electrónico para el código de verificación.",
        });
      }
    } catch (error) {
      console.error("❌ Error en login:", error);
      console.error("Detalles:", error.response?.data);
      
      const errorMsg = error.response?.data?.error || "Error al iniciar sesión.";
      setError(errorMsg);
      
      MySwal.fire({
        icon: "error",
        title: "Error de login",
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para Google Login (nueva)
  const handleGoogleSuccess = async (response) => {
    try {
      console.log('📤 Enviando Google Token al backend');
      console.log('🔍 URL de Google Auth:', `${API_BASE_URL}/api/login/auth/google`);
      const googleResponse = await axios.post(`${API_BASE_URL}/api/login/auth/google`, {
        token: response.credential, // Token de Google
      });

      console.log('📥 Respuesta Google:', googleResponse.data);

      if (googleResponse.data.token && googleResponse.data.user) {
        const { token, user } = googleResponse.data;
        
        // Guarda en localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        // Actualiza contexto
        authLogin(user, token);
        
        // Redirige a página principal del cliente
        navigate("/cliente");
        
        MySwal.fire({
          icon: "success",
          title: "¡Sesión iniciada con Google!",
          text: `Bienvenido, ${user.nombre}. Redirigiendo...`,
        });
      } else {
        console.error('❌ No se recibió token/user de Google');
        MySwal.fire({
          icon: "error",
          title: "Error en Google Login",
          text: "No se pudo autenticar con Google. Intenta con credenciales.",
        });
      }
    } catch (error) {
      console.error("❌ Error en Google login:", error);
      const errorMsg = error.response?.data?.error || "Error al iniciar sesión con Google.";
      MySwal.fire({
        icon: "error",
        title: "Error de Google",
        text: errorMsg,
      });
    }
  };

  const handleGoogleFailure = (error) => {
    console.error("❌ Google login failed:", error);
    MySwal.fire({
      icon: "error",
      title: "Error de Google",
      text: "No se pudo conectar con Google. Intenta con credenciales.",
    });
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log('\n═══════════════════════════════════════');
    console.log('🔐 PASO 2: VERIFICANDO MFA');
    console.log('═══════════════════════════════════════');

    if (!formData.mfaCode || formData.mfaCode.length !== 6) {
      MySwal.fire({
        icon: "error",
        title: "Código inválido",
        text: "Ingresa un código de 6 dígitos.",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('📤 Enviando verificación MFA');
      console.log('👤 UserID:', formData.userId);
      console.log('🔢 Código:', formData.mfaCode);
      console.log('📍 URL:', `${API_BASE_URL}/api/login/verify-mfa`);

      const response = await axios.post(`${API_BASE_URL}/api/login/verify-mfa`, {
        userId: formData.userId,
        mfaCode: formData.mfaCode,
      });

      console.log('📥 RESPUESTA COMPLETA DEL SERVIDOR:');
      console.log(JSON.stringify(response.data, null, 2));

      if (response.data.token && response.data.user) {
        const { token, user } = response.data;
        
        console.log('\n✅ AUTENTICACIÓN EXITOSA');
        console.log('═══════════════════════════════════════');
        console.log('👤 Usuario:', user.nombre || user.Nombre);
        console.log('📧 Correo:', user.correo || user.Correo);
        console.log('🎯 Tipo:', user.tipo || user.TipoUsuario);
        console.log('🎫 Token:', token.substring(0, 20) + '...');
        console.log('═══════════════════════════════════════');

        // 1. Guardar en localStorage
        console.log('💾 Guardando en localStorage...');
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        console.log('✅ Datos guardados en localStorage');
        
        // Verificar que se guardó correctamente
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        console.log('🔍 Verificando localStorage:');
        console.log('  - Token guardado:', storedToken ? '✅' : '❌');
        console.log('  - User guardado:', storedUser ? '✅' : '❌');

        // 2. Actualizar contexto
        console.log('🔄 Actualizando contexto Auth...');
        authLogin(user, token);
        console.log('✅ Contexto actualizado');

        // 3. Determinar ruta - usar TipoUsuario o tipo
        const userType = user.TipoUsuario || user.tipo;
        let redirectPath = "/";

        console.log('\n🧭 DETERMINANDO REDIRECCIÓN');
        console.log('═══════════════════════════════════════');
        console.log('📋 Usuario completo:', user);
        console.log('🎯 TipoUsuario:', user.TipoUsuario);
        console.log('🎯 tipo:', user.tipo);
        console.log('✅ Tipo final usado:', userType);
        console.log('🔍 Comparando con casos...');

        switch (userType) {
          case "Cliente":
            redirectPath = "/cliente";
            console.log('✅ Coincide con "Cliente" → /cliente');
            break;
          case "Propietario":
            redirectPath = "/cliente";  // Propietario también va a /cliente
            console.log('✅ Coincide con "Propietario" → /cliente');
            break;
          case "Repartidor":
            redirectPath = "/recepcion";  // Cambiado de /repartidor a /recepcion
            console.log('✅ Coincide con "Repartidor" → /recepcion');
            break;
          case "Administrador":
            redirectPath = "/admin";
            console.log('✅ Coincide con "Administrador" → /admin');
            break;
          default:
            console.warn('⚠️ NO COINCIDE CON NINGÚN CASO');
            console.warn('Tipo recibido:', `"${userType}"`);
            console.warn('Tipo de dato:', typeof userType);
            console.warn('Longitud:', userType?.length);
            // Por defecto, redirigir a /cliente en lugar de / (página pública)
            redirectPath = "/cliente";
            console.log('🔄 Redirigiendo por defecto a /cliente');
        }

        console.log('🎯 Ruta final determinada:', redirectPath);
        console.log('═══════════════════════════════════════');

        // 4. Mostrar alerta de éxito
        console.log('🎨 Mostrando alerta de éxito...');
        
        await MySwal.fire({
          icon: "success",
          title: "¡Bienvenido!",
          html: `<p>Sesión iniciada como <strong>${userType}</strong></p><p>Redirigiendo a: <strong>${redirectPath}</strong></p>`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          willClose: () => {
            console.log('🔔 Alerta cerrada, ejecutando redirección...');
          }
        });

        // 5. REDIRECCIÓN
        console.log('\n🚀 EJECUTANDO REDIRECCIÓN');
        console.log('═══════════════════════════════════════');
        console.log('📍 Ubicación actual:', window.location.pathname);
        console.log('🎯 Navegando a:', redirectPath);
        
        // Usar window.location as fallback
        console.log('🔄 Método 1: Usando navigate()...');
        navigate(redirectPath, { replace: true });
        
        // Fallback después de 500ms
        setTimeout(() => {
          if (window.location.pathname !== redirectPath) {
            console.warn('⚠️ navigate() no funcionó, usando window.location...');
            window.location.href = redirectPath;
          } else {
            console.log('✅ Redirección exitosa');
          }
        }, 500);

        console.log('═══════════════════════════════════════\n');
        
      } else {
        console.error('❌ Respuesta incompleta del servidor');
        console.error('Token presente:', !!response.data.token);
        console.error('User presente:', !!response.data.user);
        throw new Error("Datos incompletos en la respuesta del servidor");
      }
    } catch (error) {
      console.error('\n❌ ERROR EN VERIFICACIÓN MFA');
      console.error('═══════════════════════════════════════');
      console.error('Error completo:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      console.error('═══════════════════════════════════════\n');
      
      // Obtener mensaje de error más descriptivo
      let errorMsg = "Error al verificar el código.";
      
      if (error.response) {
        // Hay respuesta del servidor
        errorMsg = error.response.data?.error || error.response.data?.message || "Error en el servidor.";
        console.error('📋 Status:', error.response.status);
        console.error('📋 Data:', error.response.data);
      } else if (error.request) {
        // No hubo respuesta del servidor
        errorMsg = "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
        console.error('📋 Request:', error.request);
      } else {
        // Error al configurar la petición
        errorMsg = error.message || "Error desconocido.";
        console.error('📋 Error:', error.message);
      }
      
      setError(errorMsg);
      
      MySwal.fire({
        icon: "error",
        title: "Error de verificación",
        text: errorMsg,
        footer: error.response?.data?.details ? `<small>${error.response.data.details}</small>` : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    console.log('🔙 Volviendo al paso 1');
    setStep(1);
    setFormData({ correo: "", password: "", userId: "", mfaCode: "" });
    setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const steps = ['Credenciales', 'Verificación'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha('#E8DED2', 0.5)} 0%, ${alpha('#FFFFFF', 0.8)} 100%)`, // Fondo beige claro 50% opacidad a blanco 80% (guía: fondos secundarios beige, principal blanco)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
        fontFamily: "'Geist Sans', Arial, sans-serif", // Fuente principal guía
      }}
    >
      <Container component="main" maxWidth="sm">
        <MotionPaper
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          elevation={8}
          sx={{
            borderRadius: 12, // Radius 12px para tarjetas (guía 6)
            overflow: 'hidden',
            backgroundColor: '#FFFFFF', // Fondo blanco puro
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Sombra suave base
            border: `1px solid ${alpha('#2C3E50', 0.2)}`, // Borde azul 20% opacidad
            transition: 'all 200ms ease', // Transición estándar
            '&:hover': {
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', // Sombra elevada
              borderColor: alpha('#2C3E50', 0.4), // Hover border
            },
          }}
        >
          {/* Header - Degradado azul a dorado con íconos blancos/dorados */}
          <Box
            sx={{
              background: `linear-gradient(135deg, #2C3E50 0%, #D4AF37 100%)`, // Degradado principal a acento (guía colores)
              py: 6,
              textAlign: 'center',
              color: '#FFFFFF', // Texto blanco
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.1)', // Overlay sutil blanco 10%
              }}
            />
            <MotionBox
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              sx={{ position: 'relative', zIndex: 1 }}
            >
              {step === 1 ? (
                <PersonOutline sx={{ fontSize: 80, mb: 2, opacity: 0.9, color: '#FFFFFF' }} />
              ) : (
                <EmailIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9, color: '#FFFFFF' }} />
              )}
              <Typography variant="h3" component="h1" fontWeight="700" gutterBottom fontFamily="'Playfair Display', serif"> {/* Playfair bold para títulos */}
                {step === 1 ? "Iniciar Sesión" : "Verificar Código"}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontSize: '1rem', lineHeight: 1.6 }}> {/* Body regular 16px, line-height 1.6 */}
                {step === 1
                  ? "Ingresa tus credenciales para continuar"
                  : "Introduce el código de 6 dígitos enviado a tu correo electrónico"
                }
              </Typography>
            </MotionBox>
          </Box>

          {/* Content */}
          <Box sx={{ p: 6 }}>
            <Stepper activeStep={step - 1} sx={{ mb: 6 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel sx={{ 
                    '& .MuiStepLabel-iconContainer': {
                      color: alpha('#2C3E50', 0.4), // Azul 40% para steps inactivos
                    },
                    '& .Mui-active .MuiStepIcon-text': {
                      color: '#FFFFFF', // Blanco para active
                    },
                    '& .Mui-completed .MuiStepIcon-text': {
                      color: '#D4AF37', // Dorado para completados
                    },
                    '& .MuiStepLabel-label': {
                      fontFamily: "'Geist Sans', Arial, sans-serif",
                      fontWeight: 500,
                    }
                  }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 4, borderRadius: 8, border: `1px solid ${alpha('#D4AF37', 0.3)}` }}> {/* Border dorado sutil para alertas */}
                {error}
              </Alert>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <MotionBox
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleLoginSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Correo Electrónico"
                        name="correo"
                        type="email"
                        value={formData.correo}
                        onChange={handleChange}
                        placeholder="tu@correo.com"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: '#2C3E50' }} /> {/* Azul marino para íconos */}
                            </InputAdornment>
                          ),
                        }}
                        InputLabelProps={{ 
                          sx: { color: '#1A252F', fontFamily: "'Geist Sans', Arial, sans-serif" } // Negro suave para labels
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 8, // Radius base 8px
                            borderColor: alpha('#2C3E50', 0.2), // Borde azul 20% opacidad
                            '&:hover': { borderColor: alpha('#2C3E50', 0.4) }, // Hover 40%
                            '&.Mui-focused': { 
                              borderColor: '#D4AF37', // Focus dorado
                              boxShadow: `0 0 0 2px ${alpha('#D4AF37', 0.2)}`, // Outline dorado 2px
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#1A252F', // Negro suave
                          },
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Contraseña"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Contraseña"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: '#2C3E50' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={togglePasswordVisibility}
                                edge="end"
                                sx={{ color: '#1A252F' }} // Negro suave
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        InputLabelProps={{ 
                          sx: { color: '#1A252F', fontFamily: "'Geist Sans', Arial, sans-serif" } 
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                            borderColor: alpha('#2C3E50', 0.2),
                            '&:hover': { borderColor: alpha('#2C3E50', 0.4) },
                            '&.Mui-focused': { 
                              borderColor: '#D4AF37',
                              boxShadow: `0 0 0 2px ${alpha('#D4AF37', 0.2)}`,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#1A252F',
                          },
                        }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={isLoading}
                        sx={{
                          py: 2,
                          fontSize: '1rem', // 16px medium (guía botones)
                          fontWeight: 500,
                          borderRadius: 8, // 8px (guía botones)
                          backgroundColor: '#D4AF37', // Dorado principal
                          color: '#1A252F', // Texto negro suave
                          height: 44, // Altura base 44px
                          boxShadow: 'none', // Sin sombra base
                          transition: 'all 200ms ease', // Transición 200ms
                          '&:hover': {
                            backgroundColor: alpha('#D4AF37', 0.9), // Hover 90% opacidad
                            transform: 'translateY(-2px)', // Elevación 2px
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', // Sombra elevada
                          },
                          '&:active': {
                            backgroundColor: '#C19B2E', // Más oscuro active
                            transform: 'scale(0.98)', // Scale down 2%
                          },
                          '&:focus': {
                            outline: '2px solid #D4AF37', // Focus outline dorado 2px
                          },
                          '&:disabled': {
                            backgroundColor: alpha('#D4AF37', 0.5), // Disabled 50% opacidad
                            color: alpha('#1A252F', 0.5),
                            cursor: 'not-allowed',
                          },
                        }}
                      >
                        {isLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={24} color="inherit" />
                            <span>Iniciando...</span>
                          </Box>
                        ) : (
                          'Iniciar Sesión'
                        )}
                      </Button>

                      {/* Botón de Google Login (nuevo) */}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                          O inicia sesión con
                        </Typography>
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleFailure}
                          theme="filled_blue" // Tema simple
                          size="large"
                          text="iniciar sesión con google"
                          shape="rectangular"
                          logo_alignment="left"
                          width="100%"
                          sx={{
                            '& .g_id_signin': {
                              backgroundColor: '#4285F4', // Azul Google
                              color: '#FFFFFF',
                              borderRadius: 8,
                              '&:hover': {
                                backgroundColor: alpha('#4285F4', 0.9),
                              },
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </form>
                </MotionBox>
              ) : (
                <MotionBox
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleMFASubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom fontWeight="600" fontFamily="'Geist Sans', Arial, sans-serif" color="#1A252F"> {/* Negro suave */}
                          Código de Verificación (6 dígitos)
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="123456"
                          name="mfaCode"
                          value={formData.mfaCode}
                          onChange={handleChange}
                          inputProps={{
                            maxLength: 6,
                            style: { 
                              textAlign: 'center', 
                              fontSize: '1.5rem',
                              letterSpacing: '0.5em',
                              fontFamily: "'Geist Sans', monospace"
                            }
                          }}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 8,
                              borderColor: alpha('#2C3E50', 0.2),
                              bgcolor: alpha('#E8DED2', 0.3), // Beige 30% para fondo input
                              '&:hover': { borderColor: alpha('#2C3E50', 0.4) },
                              '&.Mui-focused': { 
                                borderColor: '#D4AF37',
                                boxShadow: `0 0 0 2px ${alpha('#D4AF37', 0.2)}`,
                              },
                            },
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', color: alpha('#1A252F', 0.8) }}> {/* Secondary 80% opacidad */}
                          Revisa tu correo electrónico. Válido por 10 minutos.
                        </Typography>
                      </Box>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={isLoading || formData.mfaCode.length !== 6}
                        sx={{
                          py: 2,
                          fontSize: '1rem',
                          fontWeight: 500,
                          borderRadius: 8,
                          backgroundColor: '#D4AF37',
                          color: '#1A252F',
                          height: 44,
                          boxShadow: 'none',
                          transition: 'all 200ms ease',
                          '&:hover': {
                            backgroundColor: alpha('#D4AF37', 0.9),
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                          },
                          '&:active': {
                            backgroundColor: '#C19B2E',
                            transform: 'scale(0.98)',
                          },
                          '&:focus': {
                            outline: '2px solid #D4AF37',
                          },
                          '&:disabled': {
                            backgroundColor: alpha('#D4AF37', 0.5),
                            color: alpha('#1A252F', 0.5),
                            cursor: 'not-allowed',
                          },
                        }}
                      >
                        {isLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={24} color="inherit" />
                            <span>Verificando...</span>
                          </Box>
                        ) : (
                          'Confirmar Código'
                        )}
                      </Button>

                      <Button
                        startIcon={<ArrowBack sx={{ color: '#2C3E50' }} />}
                        onClick={goBack}
                        variant="outlined"
                        sx={{
                          py: 1.5,
                          borderRadius: 8,
                          borderColor: '#2C3E50', // Borde azul marino
                          color: '#2C3E50', // Texto azul
                          fontWeight: '500',
                          '&:hover': {
                            backgroundColor: '#2C3E50', // Hover fondo azul
                            color: '#FFFFFF', // Texto blanco
                            borderColor: '#2C3E50',
                          },
                        }}
                      >
                        Volver a credenciales
                      </Button>
                    </Box>
                  </form>
                </MotionBox>
              )}
            </AnimatePresence>
              {/* ← NUEVO: Link para recuperar contraseña */}

            {/* Footer Links */}
            <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: 1, borderColor: alpha('#2C3E50', 0.2), width: '100%' }}> {/* Borde azul 20% */}
              <Typography variant="body2" color="#1A252F" fontFamily="'Geist Sans', Arial, sans-serif" sx={{ lineHeight: 1.5 }}> {/* Negro suave, line-height 1.5 */}
                ¿No tienes cuenta?{" "}
                <Button
                  onClick={() => navigate("/registro")}
                  startIcon={<PersonAdd sx={{ color: '#D4AF37' }} />} // Dorado ícono
                  sx={{ 
                    fontWeight: '500',
                    color: '#D4AF37', // Dorado link
                    textTransform: 'none',
                    '&:hover': { 
                      color: alpha('#D4AF37', 0.9), // Hover 90%
                      backgroundColor: alpha('#D4AF37', 0.1), // Fondo sutil 10%
                    },
                  }}
                >
                  Regístrate aquí
                </Button>
                          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ¿Olvidaste tu contraseña?
            </Typography>
            <Button
              component={Link}
              to="/recovery"
              variant="text"
              sx={{
                color: '#D4AF37',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { 
                  color: alpha('#D4AF37', 0.8), 
                  backgroundColor: alpha('#D4AF37', 0.1) 
                },
              }}
            >
              Recupera tu contraseña
            </Button>
          </Box>
              </Typography>
            </Box>
          </Box>
        </MotionPaper>
      </Container>
    </Box>
  );
}
export default Login;