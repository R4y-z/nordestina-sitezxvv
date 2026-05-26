'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { storeApi, setStoreToken, removeStoreToken, getStoreToken } from '@/lib/api';
import type { Customer } from '@/types';

interface AuthContextType {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function StoreAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCustomer = async () => {
    const token = getStoreToken();
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await storeApi.get('/customers/me');
      setCustomer(data);
    } catch {
      removeStoreToken();
      setCustomer(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { refreshCustomer(); }, []);

  const login = async (email: string, password: string) => {
    const { data } = await storeApi.post('/customers/login', { email, password });
    setStoreToken(data.accessToken);
    setCustomer(data.customer);
  };

  const logout = () => {
    removeStoreToken();
    setCustomer(null);
  };

  return (
    <AuthContext.Provider value={{ customer, loading, login, logout, refreshCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useStoreAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useStoreAuth must be used within StoreAuthProvider');
  return ctx;
}
