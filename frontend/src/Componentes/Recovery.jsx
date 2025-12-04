import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import DOMPurify from "dompurify";
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

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

function Recovery() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    correo: "",
    userId: "",
    resetCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
 

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 🔐 Sanitizar inputs susceptibles de XSS (texto libre)
    let sanitizedValue = value;
    if (["correo", "resetCode"].includes(name)) {
      sanitizedValue = sanitizeInput(value);
    }
    // Password no se sanitiza porque puede contener caracteres especiales válidos

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    setError("");
  };

  // Paso 1: Enviar email para reset (sin revelar si el correo existe)
  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.correo) {
      MySwal.fire({
        icon: "error",
        title: "Campo requerido",
        text: "Ingresa tu correo electrónico.",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('📤 Enviando solicitud de recovery a:', `${API_BASE_URL}/api/recovery`);
      const response = await axios.post(`${API_BASE_URL}/api/recovery`, {
        correo: formData.correo,
      });

      console.log('📥 Respuesta recovery:', response.data);

      // 🔐 Siempre avanzar al paso 2 con mensaje genérico
      // No revelamos si el correo existe o no
      setStep(2);
      setFormData((prev) => ({ ...prev, correo: formData.correo }));
      MySwal.fire({
        icon: "info",
        title: "Solicitud enviada",
        text: response.data.message || "Si tu correo está registrado, recibirás un código de recuperación. Revisa tu bandeja de entrada.",
      });
    } catch (error) {
      console.error("❌ Error en recovery:", error);
      // Mensaje genérico para no revelar información
      setStep(2);
      setFormData((prev) => ({ ...prev, correo: formData.correo }));
      MySwal.fire({
        icon: "info",
        title: "Solicitud enviada",
        text: "Si tu correo está registrado, recibirás un código de recuperación. Revisa tu bandeja de entrada.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 2: Verificar solo el código
  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.resetCode || formData.resetCode.length !== 6) {
      MySwal.fire({
        icon: "error",
        title: "Código inválido",
        text: "Debes ingresar un código de 6 dígitos.",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('📤 Verificando código de recuperación');
      const response = await axios.post(`${API_BASE_URL}/api/recovery/verify-code`, {
        correo: formData.correo,
        resetCode: formData.resetCode,
      });

      console.log('📥 Respuesta verificación de código:', response.data);

      if (response.data.success) {
        setStep(3);
        MySwal.fire({
          icon: "success",
          title: "Código verificado",
          text: response.data.message || "Código correcto. Ahora puedes ingresar tu nueva contraseña.",
        });
      }
    } catch (error) {
      console.error("❌ Error verificando código:", error);
      const errorMsg = error.response?.data?.error || "Código inválido o expirado. Solicita un nuevo código.";
      setError(errorMsg);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 3: Verificar código y nueva password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.resetCode || formData.resetCode.length !== 6) {
      MySwal.fire({
        icon: "error",
        title: "Datos inválidos",
        text: "Código de 6 dígitos requerido.",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.newPassword || formData.newPassword.length < 6) {
      MySwal.fire({
        icon: "error",
        title: "Contraseña inválida",
        text: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      MySwal.fire({
        icon: "error",
        title: "Las contraseñas no coinciden",
        text: "Asegúrate de que la nueva contraseña y la confirmación sean iguales.",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('📤 Verificando reset');
      const response = await axios.post(`${API_BASE_URL}/api/recovery/verify`, {
        correo: formData.correo,
        resetCode: formData.resetCode,
        newPassword: formData.newPassword,
      });

      console.log('📥 Respuesta reset:', response.data);

      if (response.data.success) {
        MySwal.fire({
          icon: "success",
          title: "¡Contraseña actualizada!",
          text: "Ahora puedes iniciar sesión con tu nueva contraseña.",
        });
        navigate("/login");
      }
    } catch (error) {
      console.error("❌ Error en reset:", error);
      const errorMsg = error.response?.data?.error || "Error al verificar el código.";
      setError(errorMsg);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setFormData({ correo: "", userId: "", resetCode: "", newPassword: "", confirmPassword: "" });
    setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const steps = ['Solicitar Código', 'Verificar Código', 'Nueva Contraseña'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha('#E8DED2', 0.5)} 0%, ${alpha('#FFFFFF', 0.8)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
        fontFamily: "'Geist Sans', Arial, sans-serif",
      }}
    >
      <Container component="main" maxWidth="sm">
        <MotionPaper
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          elevation={8}
          sx={{
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${alpha('#2C3E50', 0.2)}`,
            transition: 'all 200ms ease',
            '&:hover': {
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              borderColor: alpha('#2C3E50', 0.4),
            },
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, #2C3E50 0%, #D4AF37 100%)`,
              py: 6,
              textAlign: 'center',
              color: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.1)' }} />
            <MotionBox
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              sx={{ position: 'relative', zIndex: 1 }}
            >
              <Security sx={{ fontSize: 80, mb: 2, opacity: 0.9, color: '#FFFFFF' }} />
              <Typography variant="h3" component="h1" fontWeight="700" gutterBottom fontFamily="'Playfair Display', serif">
                {step === 1 && "Recuperar Contraseña"}
                {step === 2 && "Verificar Código"}
                {step === 3 && "Nueva Contraseña"}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontSize: '1rem', lineHeight: 1.6 }}>
                {step === 1 && "Ingresa tu correo para recibir un código de recuperación"}
                {step === 2 && "Introduce el código que recibiste en tu correo"}
                {step === 3 && "Ingresa tu nueva contraseña y confírmala"}
              </Typography>
            </MotionBox>
          </Box>

          <Box sx={{ p: 6 }}>
            <Stepper activeStep={step - 1} sx={{ mb: 6 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel sx={{ 
                    '& .MuiStepLabel-iconContainer': { color: alpha('#2C3E50', 0.4) },
                    '& .Mui-active .MuiStepIcon-text': { color: '#FFFFFF' },
                    '& .Mui-completed .MuiStepIcon-text': { color: '#D4AF37' },
                    '& .MuiStepLabel-label': { fontFamily: "'Geist Sans', Arial, sans-serif", fontWeight: 500 },
                  }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 4, borderRadius: 8, border: `1px solid ${alpha('#D4AF37', 0.3)}` }}>
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
                  <form onSubmit={handleRecoverySubmit}>
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
                              <Email sx={{ color: '#2C3E50' }} />
                            </InputAdornment>
                          ),
                        }}
                        InputLabelProps={{ sx: { color: '#1A252F', fontFamily: "'Geist Sans', Arial, sans-serif" } }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                            borderColor: alpha('#2C3E50', 0.2),
                            '&:hover': { borderColor: alpha('#2C3E50', 0.4) },
                            '&.Mui-focused': { borderColor: '#D4AF37', boxShadow: `0 0 0 2px ${alpha('#D4AF37', 0.2)}` },
                          },
                          '& .MuiInputLabel-root': { color: '#1A252F' },
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
                          '&:active': { backgroundColor: '#C19B2E', transform: 'scale(0.98)' },
                          '&:focus': { outline: '2px solid #D4AF37' },
                          '&:disabled': { backgroundColor: alpha('#D4AF37', 0.5), color: alpha('#1A252F', 0.5), cursor: 'not-allowed' },
                        }}
                      >
                        {isLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={24} color="inherit" />
                            <span>Enviando...</span>
                          </Box>
                        ) : (
                          'Enviar Código'
                        )}
                      </Button>
                    </Box>
                  </form>
                </MotionBox>
              ) : step === 2 ? (
                <MotionBox
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleVerifyCodeSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom fontWeight="600" fontFamily="'Geist Sans', Arial, sans-serif" color="#1A252F">
                          Código de Recuperación (6 dígitos)
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="123456"
                          name="resetCode"
                          value={formData.resetCode}
                          onChange={handleChange}
                          inputProps={{
                            maxLength: 6,
                            style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontFamily: "'Geist Sans', monospace" }
                          }}
                          onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 8,
                              borderColor: alpha('#2C3E50', 0.2),
                              bgcolor: alpha('#E8DED2', 0.3),
                              '&:hover': { borderColor: alpha('#2C3E50', 0.4) },
                              '&.Mui-focused': { borderColor: '#D4AF37', boxShadow: `0 0 0 2px ${alpha('#D4AF37', 0.2)}` },
                            },
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', color: alpha('#1A252F', 0.8) }}>
                          Revisa tu correo. El código es válido por 10 minutos.
                        </Typography>
                      </Box>

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={isLoading || formData.resetCode.length !== 6}
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
                          '&:active': { backgroundColor: '#C19B2E', transform: 'scale(0.98)' },
                          '&:focus': { outline: '2px solid #D4AF37' },
                          '&:disabled': { backgroundColor: alpha('#D4AF37', 0.5), color: alpha('#1A252F', 0.5), cursor: 'not-allowed' },
                        }}
                      >
                        {isLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={24} color="inherit" />
                            <span>Verificando...</span>
                          </Box>
                        ) : (
                          'Verificar código'
                        )}
                      </Button>

                      <Button
                        startIcon={<ArrowBack sx={{ color: '#2C3E50' }} />}
                        onClick={goBack}
                        variant="outlined"
                        sx={{
                          py: 1.5,
                          borderRadius: 8,
                          borderColor: '#2C3E50',
                          color: '#2C3E50',
                          fontWeight: '500',
                          '&:hover': { backgroundColor: '#2C3E50', color: '#FFFFFF', borderColor: '#2C3E50' },
                        }}
                      >
                        Volver
                      </Button>
                    </Box>
                  </form>
                </MotionBox>
              ) : (
                <MotionBox
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleResetSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Nueva Contraseña"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Nueva contraseña (mín. 6 chars)"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: '#2C3E50' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ color: '#1A252F' }}>
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        InputLabelProps={{ sx: { color: '#1A252F', fontFamily: "'Geist Sans', Arial, sans-serif" } }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                            borderColor: alpha('#2C3E50', 0.2),
                            '&:hover': { borderColor: alpha('#2C3E50', 0.4) },
                            '&.Mui-focused': { borderColor: '#D4AF37', boxShadow: `0 0 0 2px ${alpha('#D4AF37', 0.2)}` },
                          },
                          '& .MuiInputLabel-root': { color: '#1A252F' },
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Confirmar Contraseña"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repite tu nueva contraseña"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: '#2C3E50' }} />
                            </InputAdornment>
                          ),
                        }}
                        InputLabelProps={{ sx: { color: '#1A252F', fontFamily: "'Geist Sans', Arial, sans-serif" } }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                            borderColor: alpha('#2C3E50', 0.2),
                            '&:hover': { borderColor: alpha('#2C3E50', 0.4) },
                            '&.Mui-focused': { borderColor: '#D4AF37', boxShadow: `0 0 0 2px ${alpha('#D4AF37', 0.2)}` },
                          },
                          '& .MuiInputLabel-root': { color: '#1A252F' },
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
                          '&:active': { backgroundColor: '#C19B2E', transform: 'scale(0.98)' },
                          '&:focus': { outline: '2px solid #D4AF37' },
                          '&:disabled': { backgroundColor: alpha('#D4AF37', 0.5), color: alpha('#1A252F', 0.5), cursor: 'not-allowed' },
                        }}
                      >
                        {isLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={24} color="inherit" />
                            <span>Actualizando...</span>
                          </Box>
                        ) : (
                          'Cambiar Contraseña'
                        )}
                      </Button>
                    </Box>
                  </form>
                </MotionBox>
              )}
            </AnimatePresence>
          </Box>
        </MotionPaper>
      </Container>
    </Box>
  );
}

export default Recovery;