import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import zxcvbn from "zxcvbn";
import sha1 from "js-sha1";
import { alpha } from "@mui/material/styles";

const MySwal = withReactContent(Swal);

// URL base del backend (ajustada para local; cambia si usas Render)
const API_BASE_URL = "http://localhost:3000";

function RegistroUsuarios() {
  const navigate = useNavigate();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [passwordError, setPasswordError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellidopa: "",
    apellidoma: "",
    telefono: "",
    correo: "",
    password: "",
    tipousuario: "",
    preguntaSecreta: "",
    respuestaSecreta: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "password") {
      const strength = zxcvbn(value);
      setPasswordStrength(strength.score);
      validatePassword(value);
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    validateField(name, value);
  };

  const validateField = (name, value) => {
    let errors = { ...formErrors };

    if (name === "nombre" || name === "apellidopa" || name === "apellidoma") {
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{4,16}$/;
      if (!nameRegex.test(value)) {
        errors[name] = "Solo letras entre 4 y 16 caracteres.";
      } else {
        delete errors[name];
      }
    }

    if (name === "telefono") {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(value)) {
        errors[name] = "Contener exactamente 10 dígitos.";
      } else {
        delete errors[name];
      }
    }

    if (name === "password") {
      const passwordRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{5,20}$/;
      if (!passwordRegex.test(value)) {
        errors[name] = "Tener entre 8 y 15 caracteres.";
      } else {
        delete errors[name];
      }
    }

    if (name === "correo") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[name] = "Introduce un correo electrónico válido.";
      } else {
        delete errors[name];
      }
    }

    if (name === "tipousuario") {
      if (!["Cliente", "Propietario"].includes(value)) {
        errors[name] = "Selecciona un tipo de usuario válido.";
      } else {
        delete errors[name];
      }
    }

    if (name === "preguntaSecreta") {
      if (!value) {
        errors[name] = "Selecciona una pregunta de seguridad.";
      } else {
        delete errors[name];
      }
    }

    if (name === "respuestaSecreta") {
      if (value.length < 3) {
        errors[name] = "Mínimo 3 caracteres.";
      } else {
        delete errors[name];
      }
    }

    setFormErrors(errors);
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const commonPatterns = ["12345", "password", "qwerty", "abcdef"];
    let errorMessage = "";

    if (password.length < minLength) {
      errorMessage = `La contraseña debe tener al menos ${minLength} caracteres.`;
    }

    for (const pattern of commonPatterns) {
      if (password.toLowerCase().includes(pattern)) {
        errorMessage = "Evita usar secuencias comunes como '12345' o 'password'.";
        MySwal.fire({
          icon: "error",
          title: "Contraseña no válida",
          text: errorMessage,
        });
        break;
      }
    }

    setPasswordError(errorMessage);
  };

  const handlePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const checkPasswordCompromised = async (password) => {
    const hash = sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    try {
      const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
      const compromised = response.data.includes(suffix.toUpperCase());
      return compromised;
    } catch (error) {
      console.error("Error al verificar la contraseña en HIBP:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log("\n═══════════════════════════════════════");
    console.log("📝 INICIANDO REGISTRO DE USUARIO");
    console.log("═══════════════════════════════════════");
    console.log("📤 Datos que se enviarán:", formData);
    console.log("🌐 URL:", `${API_BASE_URL}/api/registro`);

    const isValidForm = Object.keys(formErrors).length === 0;

    if (!isValidForm || passwordError) {
      MySwal.fire({
        icon: "error",
        title: "Errores en el formulario",
        text: passwordError || "Por favor, corrige los errores antes de continuar.",
      });
      setIsLoading(false);
      return;
    }

    const isCompromised = await checkPasswordCompromised(formData.password);
    if (isCompromised) {
      MySwal.fire({
        icon: "error",
        title: "Contraseña comprometida",
        text: "Esta contraseña ha sido filtrada en brechas de datos. Por favor, elige otra.",
      });
      setIsLoading(false);
      return;
    }

    const dataToSend = {
      nombre: formData.nombre,
      apellidopa: formData.apellidopa,
      apellidoma: formData.apellidoma,
      correo: formData.correo,
      telefono: formData.telefono,
      password: formData.password,
      tipousuario: formData.tipousuario,
      preguntaSecreta: formData.preguntaSecreta,
      respuestaSecreta: formData.respuestaSecreta,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/registro`, dataToSend);
      console.log("✅ RESPUESTA DEL BACKEND:", response.data);
      console.log("═══════════════════════════════════════\n");
      
      await MySwal.fire({
        title: "¡Registro exitoso!",
        text: response.data.message || "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
        icon: "success",
        confirmButtonText: "Ir al login",
      });
      navigate("/login");
    } catch (error) {
      console.error("❌ Error completo al registrar:", error);
      console.error("📋 Response:", error.response);
      console.error("📋 Status:", error.response?.status);
      console.error("📋 Data:", error.response?.data);
      console.error("📋 Message:", error.message);
      
      let errorMessage = "No te pudiste registrar. Por favor, intenta de nuevo.";
      
      if (error.response && error.response.data) {
        // Si hay respuesta del servidor
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
        if (error.response.data.details) {
          errorMessage += ` Detalles: ${error.response.data.details}`;
        }
        MySwal.fire({
          icon: "error",
          title: "Error en el registro",
          html: `<p>${errorMessage}</p><p style="font-size: 0.8rem; color: #666;">Revisa la consola para más detalles.</p>`,
        });
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        MySwal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 3000.",
        });
      } else {
        // Error al configurar la petición
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
        return "Muy Débil";
      case 1:
        return "Débil";
      case 2:
        return "Regular";
      case 3:
        return "Fuerte";
      case 4:
        return "Muy Fuerte";
      default:
        return "";
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 0:
        return "#ef4444";
      case 1:
        return "#f97316";
      case 2:
        return "#eab308";
      case 3:
        return "#3b82f6";
      case 4:
        return "#22c55e";
      default:
        return "#d1d5db";
    }
  };

  const getStrengthTextColor = (strength) => {
    switch (strength) {
      case 0:
        return "#dc2626";
      case 1:
        return "#ea580c";
      case 2:
        return "#ca8a04";
      case 3:
        return "#2563eb";
      case 4:
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: "#FFFFFF", // Blanco puro
      padding: "1rem",
      fontFamily: "'Geist Sans', Arial, sans-serif"
    }}>
      <div style={{ 
        width: "100%", 
        maxWidth: "600px", 
        padding: "2rem", 
        backgroundColor: "#FFFFFF", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", // Sombra suave
        border: `1px solid ${alpha('#2C3E50', 0.2)}` // Borde azul 20%
      }}>
        <h1 style={{ 
          textAlign: "center", 
          color: "#1A252F", // Negro suave
          fontFamily: "'Playfair Display', serif", // Playfair para títulos
          fontSize: "2rem", // H2 base
          marginBottom: "1rem" 
        }}>
          Crear Cuenta
        </h1>
        <p style={{ 
          textAlign: "center", 
          color: alpha('#1A252F', 0.6), // Secondary 60%
          fontSize: "1rem",
          marginBottom: "2rem"
        }}>
          Completa tus datos para registrarte
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.875rem", // Caption 12px
                fontWeight: 500,
                color: "#1A252F", // Negro suave
                marginBottom: "0.5rem" 
              }}>
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${alpha('#2C3E50', 0.2)}`, // Borde azul 20%
                  borderRadius: "8px",
                  fontSize: "1rem",
                  backgroundColor: "#FFFFFF",
                  color: "#1A252F",
                  transition: "all 200ms ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#D4AF37"} // Focus dorado
                onBlur={(e) => e.target.style.borderColor = alpha('#2C3E50', 0.2)}
                required
              />
              {formErrors.nombre && (
                <p style={{ 
                  color: alpha('#1A252F', 0.6), // Secondary 60% error
                  fontSize: "0.75rem",
                  marginTop: "0.5rem"
                }}>
                  ⚠ {formErrors.nombre}
                </p>
              )}
            </div>

            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#1A252F",
                marginBottom: "0.5rem" 
              }}>
                Apellido Paterno
              </label>
              <input
                type="text"
                name="apellidopa"
                value={formData.apellidopa}
                onChange={handleChange}
                placeholder="Apellido paterno"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${alpha('#2C3E50', 0.2)}`,
                  borderRadius: "8px",
                  fontSize: "1rem",
                  backgroundColor: "#FFFFFF",
                  color: "#1A252F",
                  transition: "all 200ms ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
                onBlur={(e) => e.target.style.borderColor = alpha('#2C3E50', 0.2)}
                required
              />
              {formErrors.apellidopa && (
                <p style={{ 
                  color: alpha('#1A252F', 0.6),
                  fontSize: "0.75rem",
                  marginTop: "0.5rem"
                }}>
                  ⚠ {formErrors.apellidopa}
                </p>
              )}
            </div>

            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#1A252F",
                marginBottom: "0.5rem" 
              }}>
                Apellido Materno
              </label>
              <input
                type="text"
                name="apellidoma"
                value={formData.apellidoma}
                onChange={handleChange}
                placeholder="Apellido materno"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${alpha('#2C3E50', 0.2)}`,
                  borderRadius: "8px",
                  fontSize: "1rem",
                  backgroundColor: "#FFFFFF",
                  color: "#1A252F",
                  transition: "all 200ms ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
                onBlur={(e) => e.target.style.borderColor = alpha('#2C3E50', 0.2)}
                required
              />
              {formErrors.apellidoma && (
                <p style={{ 
                  color: alpha('#1A252F', 0.6),
                  fontSize: "0.75rem",
                  marginTop: "0.5rem"
                }}>
                  ⚠ {formErrors.apellidoma}
                </p>
              )}
            </div>

            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#1A252F",
                marginBottom: "0.5rem" 
              }}>
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="10 dígitos"
                maxLength={10}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${alpha('#2C3E50', 0.2)}`,
                  borderRadius: "8px",
                  fontSize: "1rem",
                  backgroundColor: "#FFFFFF",
                  color: "#1A252F",
                  transition: "all 200ms ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
                onBlur={(e) => e.target.style.borderColor = alpha('#2C3E50', 0.2)}
                required
              />
              {formErrors.telefono && (
                <p style={{ 
                  color: alpha('#1A252F', 0.6),
                  fontSize: "0.75rem",
                  marginTop: "0.5rem"
                }}>
                  ⚠ {formErrors.telefono}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1A252F",
              marginBottom: "0.5rem" 
            }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="tu@correo.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${alpha('#2C3E50', 0.2)}`,
                borderRadius: "8px",
                fontSize: "1rem",
                backgroundColor: "#FFFFFF",
                color: "#1A252F",
                transition: "all 200ms ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
              onBlur={(e) => e.target.style.borderColor = alpha('#2C3E50', 0.2)}
              required
            />
            {formErrors.correo && (
              <p style={{ 
                color: alpha('#1A252F', 0.6),
                fontSize: "0.75rem",
                marginTop: "0.5rem"
              }}>
                ⚠ {formErrors.correo}
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1A252F",
              marginBottom: "0.5rem" 
            }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Crea una contraseña segura"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  paddingRight: "40px", // Espacio para toggle
                  border: `1px solid ${alpha('#2C3E50', 0.2)}`,
                  borderRadius: "8px",
                  fontSize: "1rem",
                  backgroundColor: "#FFFFFF",
                  color: "#1A252F",
                  transition: "all 200ms ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
                onBlur={(e) => e.target.style.borderColor = alpha('#2C3E50', 0.2)}
                required
              />
              <button
                type="button"
                onClick={handlePasswordVisibility}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: alpha('#1A252F', 0.6), // Secondary 60%
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  padding: 0
                }}
              >
                {passwordVisible ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {formErrors.password && (
              <p style={{ 
                color: alpha('#1A252F', 0.6),
                fontSize: "0.75rem",
                marginTop: "0.5rem"
              }}>
                ⚠ {formErrors.password}
              </p>
            )}
            {formData.password && (
              <div style={{ 
                marginTop: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}>
                <div style={{ 
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ 
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: alpha('#1A252F', 0.8)
                  }}>
                    Seguridad de la contraseña:
                  </span>
                  <span style={{ 
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    color: getStrengthTextColor(passwordStrength)
                  }}>
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                </div>
                <div style={{ 
                  width: "100%",
                  height: "0.5rem",
                  backgroundColor: alpha('#E8DED2', 0.5), // Beige 50%
                  borderRadius: "9999px",
                  overflow: "hidden"
                }}>
                  <div 
                    style={{ 
                      height: "100%",
                      width: `${((passwordStrength + 1) / 5) * 100}%`,
                      backgroundColor: getStrengthColor(passwordStrength),
                      borderRadius: "9999px",
                      transition: "width 0.3s ease"
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1A252F",
              marginBottom: "0.5rem" 
            }}>
              Pregunta de Seguridad
            </label>
            <select
              name="preguntaSecreta"
              value={formData.preguntaSecreta}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${alpha('#2C3E50', 0.2)}`,
                borderRadius: "8px",
                fontSize: "1rem",
                backgroundColor: "#FFFFFF",
                color: "#1A252F",
                transition: "all 200ms ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
              onBlur={(e) => e.target.style.borderColor = alpha('#2C3E50', 0.2)}
              required
            >
              <option value="">Selecciona una pregunta</option>
              <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
              <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
              <option value="¿Cuál es el nombre de tu escuela primaria?">¿Cuál es el nombre de tu escuela primaria?</option>
            </select>
            {formErrors.preguntaSecreta && (
              <p style={{ 
                color: alpha('#1A252F', 0.6),
                fontSize: "0.75rem",
                marginTop: "0.5rem"
              }}>
                ⚠ {formErrors.preguntaSecreta}
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1A252F",
              marginBottom: "0.5rem" 
            }}>
              Respuesta de Seguridad
            </label>
            <input
              type="text"
              name="respuestaSecreta"
              value={formData.respuestaSecreta}
              onChange={handleChange}
              placeholder="Tu respuesta"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${alpha('#2C3E50', 0.2)}`,
                borderRadius: "8px",
                fontSize: "1rem",
                backgroundColor: "#FFFFFF",
                color: "#1A252F",
                transition: "all 200ms ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
              onBlur={(e) => e.target.style.borderColor = alpha('#2C3E50', 0.2)}
              required
            />
            {formErrors.respuestaSecreta && (
              <p style={{ 
                color: alpha('#1A252F', 0.6),
                fontSize: "0.75rem",
                marginTop: "0.5rem"
              }}>
                ⚠ {formErrors.respuestaSecreta}
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1A252F",
              marginBottom: "0.5rem" 
            }}>
              Tipo de Usuario
            </label>
            <select
              name="tipousuario"
              value={formData.tipousuario}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${alpha('#2C3E50', 0.2)}`,
                borderRadius: "8px",
                fontSize: "1rem",
                backgroundColor: "#FFFFFF",
                color: "#1A252F",
                transition: "all 200ms ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
              onBlur={(e) => e.target.style.borderColor = alpha('#2C3E50', 0.2)}
              required
            >
              <option value="">Selecciona tu tipo de usuario</option>
              <option value="Cliente">Cliente</option>
              <option value="Propietario">Propietario</option>
            </select>
            {formErrors.tipousuario && (
              <p style={{ 
                color: alpha('#1A252F', 0.6),
                fontSize: "0.75rem",
                marginTop: "0.5rem"
              }}>
                ⚠ {formErrors.tipousuario}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px 24px",
              backgroundColor: "#D4AF37", // Dorado principal
              color: "#1A252F", // Negro suave texto
              fontWeight: 500,
              borderRadius: "8px",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 200ms ease",
              height: "44px",
              fontSize: "1rem",
              fontFamily: "'Geist Sans', Arial, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem"
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  border: "2px solid alpha('#FFFFFF', 0.3)",
                  borderTop: "2px solid '#FFFFFF'",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                Registrando...
              </>
            ) : (
              "Crear Cuenta"
            )}
          </button>
        </form>

        <div style={{ 
          textAlign: "center", 
          marginTop: "1.5rem" 
        }}>
          <p style={{ 
            color: alpha('#1A252F', 0.8), // Secondary 80%
            fontSize: "1rem",
            lineHeight: 1.6
          }}>
            ¿Ya tienes una cuenta?{" "}
            <button 
              onClick={() => navigate("/login")}
              style={{
                color: "#D4AF37", // Dorado link
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "all 200ms ease",
                textDecoration: "none",
                fontFamily: "'Geist Sans', Arial, sans-serif"
              }}
              onMouseOver={(e) => {
                e.target.style.color = alpha('#D4AF37', 0.9);
                e.target.style.backgroundColor = alpha('#D4AF37', 0.1);
                e.target.style.textDecoration = "underline";
              }}
              onMouseOut={(e) => {
                e.target.style.color = "#D4AF37";
                e.target.style.backgroundColor = "none";
                e.target.style.textDecoration = "none";
              }}
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegistroUsuarios;