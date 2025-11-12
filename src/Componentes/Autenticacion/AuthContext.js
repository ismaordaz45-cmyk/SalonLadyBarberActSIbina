import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const logout = () => {
    console.log('🚪 AuthContext.logout() ejecutado');
    
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