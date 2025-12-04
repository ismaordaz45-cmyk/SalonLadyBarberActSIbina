import React from 'react';
import { useAuth } from './AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

// Ruta protegida con verificación opcional de roles
// Uso:
//   <ProtectedRoute><ComponentePrivado /></ProtectedRoute>
//   <ProtectedRoute allowedRoles={['Administrador']}><ComponenteAdmin /></ProtectedRoute>
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, getUserType } = useAuth();
  const location = useLocation();

  // No autenticado → redirige a login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Si se especifican roles permitidos, validarlos
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = getUserType();

    if (!allowedRoles.includes(userRole)) {
      // Usuario autenticado pero sin rol necesario → acceso denegado
      // Redirige a login o a una página de acceso denegado (por ahora login)
      return <Navigate to="/login" replace state={{ from: location.pathname, unauthorized: true }} />;
    }
  }

  return children;
};  

export default ProtectedRoute;