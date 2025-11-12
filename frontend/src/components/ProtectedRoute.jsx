import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';
import MainLayout from './layout/MainLayout.jsx';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;
  return isAuthenticated ? (
    <MainLayout>
      <MainLayout.Navbar>
        <Navbar />
      </MainLayout.Navbar>
      <Outlet />
    </MainLayout>
  ) : (
    <Navigate to="/login" replace />
  );
}
