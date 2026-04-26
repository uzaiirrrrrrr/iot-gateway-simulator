import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Gateways from './pages/Gateways';
import Devices from './pages/Devices';

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
            <Route index element={<Navigate to="/gateways" replace />} />
            <Route path="gateways" element={<Gateways />} />
            <Route path="devices" element={<Devices />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
