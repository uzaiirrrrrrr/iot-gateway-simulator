import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Gateways from './pages/Gateways';
import Devices from './pages/Devices';
import Simulation from './pages/Simulation';
import Logs from './pages/Logs';
import Reports from './pages/Reports';
import NetworkVisualizer from './pages/NetworkVisualizer';
import CloudPipeline from './pages/CloudPipeline';
import SystemHealth from './pages/SystemHealth';
import SecurityAudit from './pages/SecurityAudit';
import TrainingEnvironment from './pages/TrainingEnvironment';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="gateways" element={<Gateways />} />
            <Route path="devices" element={<Devices />} />
            <Route path="simulation" element={<Simulation />} />
            <Route path="training" element={<TrainingEnvironment />} />
            <Route path="network" element={<NetworkVisualizer />} />
            <Route path="cloud" element={<CloudPipeline />} />
            <Route path="health" element={<SystemHealth />} />
            <Route path="audit" element={<SecurityAudit />} />
            <Route path="logs" element={<Logs />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
