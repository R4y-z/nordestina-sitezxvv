'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import type { User, AuthState } from '@/types';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginByPin: (pin: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    const token = Cookies.get('sz_token');
    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setState({ user: data, token, isAuthenticated: true, isLoading: false });
    } catch {
      Cookies.remove('sz_token');
      Cookies.remove('sz_refresh');
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    Cookies.set('sz_token', data.accessToken, { expires: 7 });
    Cookies.set('sz_refresh', data.refreshToken, { expires: 30 });
    setState({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false });
  };

  const loginByPin = async (pin: string) => {
    const { data } = await api.post('/auth/login/pin', { pin });
    Cookies.set('sz_token', data.accessToken, { expires: 7 });
    setState({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    Cookies.remove('sz_token');
    Cookies.remove('sz_refresh');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginByPin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
