import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
export const API_BASE_URL = process.env.REACT_APP_API_URL || "https://salonladybarberbackend.onrender.com";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carga desde localStorage al montar
  useEffect(() => {
    console.log('🔄 AuthContext: Inicializando...');
    
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      
      console.log('📦 Datos en localStorage:');
      console.log('  - Token:', storedToken ? '✅ Existe' : '❌ No existe');
      console.log('  - User:', storedUser ? '✅ Existe' : '❌ No existe');
      
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        console.log('👤 Usuario recuperado:', parsedUser);
        
        setUser(parsedUser);
        setToken(storedToken);
        console.log('✅ Estado de Auth actualizado desde localStorage');
      } else {
        console.log('⚠️ No hay datos de sesión en localStorage');
      }
    } catch (error) {
      console.error('❌ Error al cargar datos de localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔐 Expiración de sesión en frontend basada en iat del JWT (máx 15 minutos)
  useEffect(() => {
    if (!token) return;

    let timeoutId;

    try {
      const decoded = jwtDecode(token);
      const issuedAtSeconds = decoded.iat || 0;
      const issuedAtMs = issuedAtSeconds * 1000;
      const now = Date.now();
      const maxSessionMs = 15 * 60 * 1000; // 15 minutos
      const elapsed = now - issuedAtMs;

      console.log('🕒 Verificando expiración de sesión (frontend based):');
      console.log('  - iat:', new Date(issuedAtMs).toISOString());
      console.log('  - Ahora:', new Date(now).toISOString());
      console.log('  - Transcurrido (ms):', elapsed);

      if (elapsed >= maxSessionMs) {
        console.log('⏳ Sesión excede 15 minutos. Cerrando sesión...');
        logout();
        return;
      }

      const remaining = maxSessionMs - elapsed;
      console.log('⏱️ Programando logout automático en (ms):', remaining);

      timeoutId = setTimeout(() => {
        console.log('⏰ Tiempo máximo de sesión alcanzado (15 min). Ejecutando logout...');
        logout();
      }, remaining);
    } catch (error) {
      console.error('❌ Error decodificando JWT en AuthContext:', error);
      // Si el token es inválido, cerrar sesión por seguridad
      logout();
    }

    // Limpiar timeout si cambia el token o se desmonta
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [token]);

  const login = (userData, authToken) => {
    console.log('\n🔐 AuthContext.login() ejecutado');
    console.log('═══════════════════════════════════════');
    console.log('📥 Datos recibidos:');
    console.log('User:', userData);
    console.log('Token:', authToken ? authToken.substring(0, 20) + '...' : 'null');
    console.log('═══════════════════════════════════════');

    try {
      // Actualizar estado
      setUser(userData);
      setToken(authToken);
      console.log('✅ Estado de React actualizado');

      // Guardar en localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", authToken);
      console.log('💾 Datos guardados en localStorage');

      // Verificar que se guardó correctamente
      const verifyUser = localStorage.getItem("user");
      const verifyToken = localStorage.getItem("token");
      
      console.log('\n🔍 Verificación de guardado:');
      console.log('  User en localStorage:', verifyUser ? '✅' : '❌');
      console.log('  Token en localStorage:', verifyToken ? '✅' : '❌');
      
      if (verifyUser && verifyToken) {
        const parsedUser = JSON.parse(verifyUser);
        console.log('  Tipo de usuario guardado:', parsedUser.TipoUsuario || parsedUser.tipo);
        console.log('✅ Login completado exitosamente');
      } else {
        console.error('❌ ERROR: Los datos NO se guardaron en localStorage');
      }
      
      console.log('═══════════════════════════════════════\n');
      
    } catch (error) {
      console.error('❌ Error en login():', error);
    }
  };

  const logout = async () => {
    console.log('🚪 AuthContext.logout() ejecutado');
    
    // 🔐 Invalidar token en el backend antes de limpiar localStorage
    const currentToken = token || localStorage.getItem("token");
    if (currentToken) {
      try {
        await axios.post(
          `${API_BASE_URL}/api/login/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${currentToken}` }
          }
        );
        console.log('✅ Token invalidado en el servidor');
      } catch (error) {
        // Continuar con logout incluso si falla la llamada al servidor
        console.warn('⚠️ No se pudo invalidar token en servidor (puede estar desconectado):', error.message);
      }
    }
    
    // Limpiar estado local
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    console.log('✅ Sesión cerrada y localStorage limpiado');
  };

  // Función auxiliar para obtener el tipo de usuario
  const getUserType = () => {
    if (!user) return null;
    return user.TipoUsuario || user.tipo;
  };

  // Función auxiliar para verificar si está autenticado
  const isAuthenticated = () => {
    return !!(user && token);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isLoading,
        getUserType,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};