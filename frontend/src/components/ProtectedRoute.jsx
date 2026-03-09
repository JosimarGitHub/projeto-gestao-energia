import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  // Se não tem token, manda para o login (igual ao @login_required)
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
