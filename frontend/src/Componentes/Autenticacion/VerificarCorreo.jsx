import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import DOMPurify from "dompurify";
import { alpha } from "@mui/material/styles";

const MySwal = withReactContent(Swal);

// URL base del backend
const API_BASE_URL = "http://localhost:3000";
// 🔐 Sanitizador de entrada para prevenir XSS
const sanitizeInput = (value) =>
  DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();

function VerificarCorreo() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!codigo || codigo.length !== 6) {
      MySwal.fire({
        icon: "error",
        title: "Código inválido",
        text: "Por favor ingresa un código de 6 dígitos.",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log("Verificando código:", codigo);
      const response = await axios.get(
        `${API_BASE_URL}/api/registro/verify/${codigo}`
      );

      console.log("Respuesta del backend:", response.data);

      MySwal.fire({
        icon: "success",
        title: "¡Verificación exitosa!",
        text: response.data.message || "Tu cuenta ha sido verificada exitosamente.",
        confirmButtonText: "Ir al login",
      }).then(() => {
        navigate("/login");
      });
    } catch (error) {
      console.error("Error al verificar el código:", error.response?.data);
      const errorMsg = error.response?.data?.error || "Código inválido o expirado.";
      
      MySwal.fire({
        icon: "error",
        title: "Error de verificación",
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      MySwal.fire({
        icon: "warning",
        title: "Correo requerido",
        text: "Por favor ingresa tu correo electrónico para reenviar el código.",
        input: "email",
        inputPlaceholder: "tu@correo.com",
        showCancelButton: true,
        confirmButtonText: "Reenviar",
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
          if (!value) {
            return "Debes ingresar un correo electrónico";
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return "Correo electrónico inválido";
          }
        }
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          setIsResending(true);
          try {
            const response = await axios.post(
              `${API_BASE_URL}/api/registro/resend-code`,
              { correo: result.value }
            );
            
            MySwal.fire({
              icon: "success",
              title: "Código reenviado",
              text: response.data.message || "Se ha enviado un nuevo código a tu correo.",
            });
            setEmail(result.value);
          } catch (error) {
            const errorMsg = error.response?.data?.error || "Error al reenviar el código.";
            MySwal.fire({
              icon: "error",
              title: "Error",
              text: errorMsg,
            });
          } finally {
            setIsResending(false);
          }
        }
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/registro/resend-code`,
        { correo: email }
      );
      
      MySwal.fire({
        icon: "success",
        title: "Código reenviado",
        text: response.data.message || "Se ha enviado un nuevo código a tu correo.",
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al reenviar el código.";
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: errorMsg,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        padding: "1rem",
        fontFamily: "'Geist Sans', Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "3rem",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          border: `1px solid ${alpha('#2C3E50', 0.2)}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              color: "#1A252F",
              fontFamily: "'Playfair Display', serif",
              fontSize: "2rem",
              marginBottom: "0.5rem",
            }}
          >
            Verificar Correo
          </h1>
          <p
            style={{
              color: alpha('#1A252F', 0.6),
              fontSize: "1rem",
            }}
          >
            Ingresa el código de verificación enviado a tu correo electrónico
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#1A252F",
                marginBottom: "0.5rem",
              }}
            >
              Código de Verificación (6 dígitos)
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                // 🔐 Sanitizar código para prevenir XSS
                const sanitizedValue = sanitizeInput(value);
                if (sanitizedValue.length <= 6) {
                  setCodigo(sanitizedValue);
                }
              }}
              placeholder="123456"
              maxLength={6}
              required
              style={{
                width: "100%",
                padding: "16px",
                border: `1px solid ${alpha('#2C3E50', 0.2)}`,
                borderRadius: "8px",
                fontSize: "1.5rem",
                letterSpacing: "0.5em",
                textAlign: "center",
                fontFamily: "'Geist Sans', monospace",
                backgroundColor: alpha('#E8DED2', 0.3),
                transition: "all 200ms ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#D4AF37";
                e.target.style.boxShadow = `0 0 0 2px ${alpha('#D4AF37', 0.2)}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = alpha('#2C3E50', 0.2);
                e.target.style.boxShadow = "none";
              }}
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: alpha('#1A252F', 0.6),
                marginTop: "0.5rem",
                textAlign: "center",
              }}
            >
              El código fue enviado a tu correo. Verifica también tu carpeta de spam.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || codigo.length !== 6}
            style={{
              width: "100%",
              padding: "14px 24px",
              backgroundColor: codigo.length === 6 && !isLoading ? "#D4AF37" : alpha('#D4AF37', 0.5),
              color: codigo.length === 6 && !isLoading ? "#1A252F" : alpha('#1A252F', 0.5),
              fontWeight: 500,
              borderRadius: "8px",
              border: "none",
              cursor: codigo.length === 6 && !isLoading ? "pointer" : "not-allowed",
              transition: "all 200ms ease",
              height: "48px",
              fontSize: "1rem",
              fontFamily: "'Geist Sans', Arial, sans-serif",
            }}
          >
            {isLoading ? "Verificando..." : "Verificar Código"}
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "center" }}>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              style={{
                background: "none",
                border: "none",
                color: "#D4AF37",
                cursor: isResending ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "underline",
                opacity: isResending ? 0.6 : 1,
              }}
            >
              {isResending ? "Reenviando..." : "¿No recibiste el código? Reenviar"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "none",
                color: alpha('#1A252F', 0.6),
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "underline",
              }}
            >
              Volver al login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VerificarCorreo;
