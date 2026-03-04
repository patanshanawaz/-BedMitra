import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('icu_token');
    if (token) {
      authAPI.getMe()
        .then(r => setUser(r.data.data))
        .catch(() => { localStorage.removeItem('icu_token'); localStorage.removeItem('icu_user'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('icu_token', token);
    localStorage.setItem('icu_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('icu_token');
    localStorage.removeItem('icu_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';
  const isHospitalAdmin = user?.role === 'hospital_admin' || user?.role === 'super_admin';
  const isStaff = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isSuperAdmin, isHospitalAdmin, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
};
