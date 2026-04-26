import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return;
    try {
      const res = await axios.post('http://localhost:5000/api/auth/refresh-token', { token: refreshToken });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    } catch (e) {
      logout();
    }
  }, [refreshToken, logout]);

  useEffect(() => {
    if (token) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [token, logout]);

  // Inactivity Timer (Improved)
  useEffect(() => {
    if (!token) return;

    let timer;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 Minutes

    const performLogout = () => {
      console.log('Session expired due to inactivity.');
      alert('Your session has expired due to inactivity. Please log in again.');
      logout();
    };

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(performLogout, INACTIVITY_TIMEOUT);
    };

    // Events that count as activity
    const activityEvents = ['mousemove', 'keypress', 'mousedown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (timer) clearTimeout(timer);
    };
  }, [token, logout]);

  // Periodic Refresh (every 20 mins)
  useEffect(() => {
    if (token && refreshToken) {
        const interval = setInterval(refreshAccessToken, 20 * 60 * 1000);
        return () => clearInterval(interval);
    }
  }, [token, refreshToken, refreshAccessToken]);

  const login = async (email, password, rememberMe) => {
    const res = await axios.post('http://localhost:5000/api/auth/login', { email, password, rememberMe });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setRefreshToken(res.data.refreshToken);
    setUser(res.data.user);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    return res.data.user;
  };

  const logoutAll = useCallback(async () => {
    try {
      if (token) {
        await axios.post('http://localhost:5000/api/auth/logout-all');
      }
    } catch (e) {
      console.error('Logout all failed', e);
    } finally {
      logout();
    }
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, logoutAll, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};
