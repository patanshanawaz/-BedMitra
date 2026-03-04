import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Home from './pages/Public/Home';
import HospitalListPage from './pages/Public/HospitalListPage';
import HospitalDetailPage from './pages/Public/HospitalDetailPage';
import LoginPage from './pages/Auth/LoginPage';

import HospitalLayout from './components/layout/HospitalLayout';
import DashboardPage from './pages/Hospital/DashboardPage';
import PatientsPage from './pages/Hospital/PatientsPage';
import AdmitPatientPage from './pages/Hospital/AdmitPatientPage';
import WardManagementPage from './pages/Hospital/WardManagementPage';
import BedManagementPage from './pages/Hospital/BedManagementPage';
import StaffPage from './pages/Hospital/StaffPage';

import AdminLayout from './components/layout/AdminLayout';
import SuperAdminDashboard from './pages/Admin/SuperAdminDashboard';
import HospitalManagementPage from './pages/Admin/HospitalManagementPage';
import AddHospitalPage from './pages/Admin/AddHospitalPage';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/hospital/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user) return <Navigate to={user.role === 'super_admin' ? '/admin/dashboard' : '/hospital/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/hospitals" element={<HospitalListPage />} />
      <Route path="/hospitals/:id" element={<HospitalDetailPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Hospital Staff/Admin */}
      <Route path="/hospital" element={<PrivateRoute roles={['hospital_admin','hospital_staff','super_admin']}><HospitalLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/admit" element={<AdmitPatientPage />} />
        <Route path="wards" element={<WardManagementPage />} />
        <Route path="wards/:wardId/beds" element={<BedManagementPage />} />
        <Route path="staff" element={<PrivateRoute roles={['hospital_admin','super_admin']}><StaffPage /></PrivateRoute>} />
      </Route>

      {/* Super Admin */}
      <Route path="/admin" element={<PrivateRoute roles={['super_admin']}><AdminLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="hospitals" element={<HospitalManagementPage />} />
        <Route path="hospitals/add" element={<AddHospitalPage />} />
        <Route path="hospitals/:id/dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { fontFamily: 'Inter,sans-serif', fontSize: '14px', fontWeight: 500, borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,.12)' },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
