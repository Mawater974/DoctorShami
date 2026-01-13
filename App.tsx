
import React, { useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './store';
import { Role } from './types';
import { RouteHandler } from './components/RouteHandler';
import { Spinner } from './components/UiComponents';

// Lazy Load Pages for Performance (Code Splitting)
// This ensures we don't download the Admin Dashboard code if a user just visits the Home page.
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Clinics = React.lazy(() => import('./pages/Clinics').then(module => ({ default: module.Clinics })));
const Pharmacies = React.lazy(() => import('./pages/Pharmacies').then(module => ({ default: module.Pharmacies })));
const Details = React.lazy(() => import('./pages/Details').then(module => ({ default: module.Details })));
const Auth = React.lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const ProviderDashboard = React.lazy(() => import('./pages/ProviderDashboard').then(module => ({ default: module.ProviderDashboard })));
const Appointments = React.lazy(() => import('./pages/Appointments').then(module => ({ default: module.Appointments })));
const Settings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const RegisterFacility = React.lazy(() => import('./pages/RegisterFacility').then(module => ({ default: module.RegisterFacility })));
const Messages = React.lazy(() => import('./pages/Messages').then(module => ({ default: module.Messages })));

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode, 
  allowedRoles?: Role[] 
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useStore();

  if (isLoading) {
      return <div className="flex h-screen items-center justify-center"><Spinner /></div>;
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
  const { lang, theme, checkSession, fetchReferenceData } = useStore();

  useEffect(() => {
    checkSession();
    // Preload city/specialty data once on app load
    fetchReferenceData();
  }, [checkSession, fetchReferenceData]);

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
      <RouteHandler />
      <Layout>
        {/* Suspense shows a loading indicator while the specific page chunk is downloading */}
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/pharmacies" element={<Pharmacies />} />
            
            {/* Details Routes */}
            <Route path="/directory/:id" element={<Details />} />
            <Route path="/clinic/:id" element={<Details />} />
            <Route path="/pharmacy/:id" element={<Details />} />
            
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

            {/* Registration Page */}
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

            {/* Provider Routes */}
            <Route path="/provider" element={
              <ProtectedRoute allowedRoles={[Role.CLINIC_OWNER, Role.PHARMACY_OWNER, Role.PATIENT]}>
                <ProviderDashboard />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
};

export default App;
