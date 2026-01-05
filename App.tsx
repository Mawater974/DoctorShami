
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Clinics } from './pages/Clinics';
import { Pharmacies } from './pages/Pharmacies';
import { Details } from './pages/Details';
import { Auth } from './pages/Auth';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { Appointments } from './pages/Appointments';
import { Settings } from './pages/Settings';
import { RegisterFacility } from './pages/RegisterFacility';
import { Messages } from './pages/Messages';
import { useStore } from './store';
import { Role } from './types';
import { RouteHandler } from './components/RouteHandler';

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode, 
  allowedRoles?: Role[] 
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useStore();

  if (isLoading) {
      return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { lang, theme, checkSession } = useStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    // Initialize Theme and Direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [lang, theme]);

  return (
    <HashRouter>
      {/* RouteHandler must be inside Router to use useLocation */}
      <RouteHandler />
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/clinics" element={<Clinics />} />
          <Route path="/pharmacies" element={<Pharmacies />} />
          <Route path="/directory/:id" element={<Details />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected Routes */}
          <Route path="/messages" element={
             <ProtectedRoute>
                <Messages />
             </ProtectedRoute>
          } />
          <Route path="/appointments" element={
             <ProtectedRoute>
                <Appointments />
             </ProtectedRoute>
          } />
          <Route path="/settings" element={
             <ProtectedRoute>
                <Settings />
             </ProtectedRoute>
          } />

          {/* Registration Page - For Patients who want to become Providers */}
          <Route path="/register-facility" element={
             <ProtectedRoute allowedRoles={[Role.PATIENT]}>
                <RegisterFacility />
             </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Provider Routes - Allow PATIENT so they can access registration modal */}
          <Route path="/provider" element={
            <ProtectedRoute allowedRoles={[Role.CLINIC_OWNER, Role.PHARMACY_OWNER, Role.PATIENT]}>
              <ProviderDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
