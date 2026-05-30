import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Gateways from './pages/Gateways';
import Devices from './pages/Devices';
import SecurityVisualization from './pages/SecurityVisualization';
import TrafficAnalytics from './pages/TrafficAnalytics';
import CloudSimulation from './pages/CloudSimulation';
import Dashboard from './pages/Dashboard';

import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="gateways" element={<Gateways />} />
            <Route path="devices" element={<Devices />} />
            <Route path="security" element={<SecurityVisualization />} />
            <Route path="analytics" element={<TrafficAnalytics />} />
            <Route path="cloud" element={<CloudSimulation />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
