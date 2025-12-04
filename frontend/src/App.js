import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'; // Añadido
import LayoutConEncabezado from './Componentes/Layout/LayoutEncabezado.jsx';
import PaginaPrincipal from './Paginas/PaginaPrincipal';
import PaginaPrincipalAdministrativa from './Paginas/PaginaPrincipalAdministrativo';
import PaginaPrincipalCliente from './Paginas/PaginaPrincipalCliente';
import PaginaPrincipalRecepcion from './Paginas/PaginaPrincipalRecepcion.jsx';
import { ThemeProvider } from './Componentes/Temas/ThemeContext';
import { AuthProvider } from './Componentes/Autenticacion/AuthContext';
import ProtectedRoute from './Componentes/Autenticacion/ProtectedRoute.jsx';
import Login from './Componentes/Autenticacion/Login';
import Registro from './Componentes/Autenticacion/Registro';
import VerificarCorreo from './Componentes/Autenticacion/VerificarCorreo';  // ✅ Agregado: Import faltante
import Recovery from './Componentes/Recovery';  // ← Importa
const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}> {/* Envuelve toda la app */}
          <LayoutConEncabezado>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<PaginaPrincipal />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/verificar-correo" element={<VerificarCorreo />} />  {/* ✅ Agregado: Ruta faltante */}
          
              <Route path="/recovery" element={<Recovery />} />
              {/* Rutas administrador (solo Administrador) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['Administrador']}>
                    <PaginaPrincipalAdministrativa />
                  </ProtectedRoute>
                }
              />

              {/* Rutas clientes (solo Cliente) */}
              <Route
                path="/cliente"
                element={
                  <ProtectedRoute allowedRoles={['Cliente']}>
                    <PaginaPrincipalCliente />
                  </ProtectedRoute>
                }
              />

              {/* Rutas repartidor (solo Repartidor) */}
              <Route
                path="/recepcion"
                element={
                  <ProtectedRoute allowedRoles={['Repartidor']}>
                    <PaginaPrincipalRecepcion />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </LayoutConEncabezado>
        </GoogleOAuthProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;