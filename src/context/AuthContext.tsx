import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { AuthUser } from '../types';

interface AuthState { user: AuthUser | null; tenantId: string; regionId: string }
interface AuthCtx extends AuthState {
  isAuthenticated: boolean;
  login: (user: AuthUser, tenantId: string, regionId: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem('authUser');
    return {
      user: raw ? (JSON.parse(raw) as AuthUser) : null,
      tenantId: localStorage.getItem('tenantId') ?? '',
      regionId: localStorage.getItem('regionId') ?? '',
    };
  } catch { return { user: null, tenantId: '', regionId: '' }; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState);

  useEffect(() => {
    if (!localStorage.getItem('tenantId')) {
      apiClient
        .get<{ tenantId: string; regionId: string; tenantName: string }>('/config')
        .then(r => {
          if (r.data?.tenantId) {
            localStorage.setItem('tenantId', r.data.tenantId);
            localStorage.setItem('regionId', r.data.regionId);
            setState(s => ({ ...s, tenantId: r.data.tenantId, regionId: r.data.regionId }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const login = useCallback((user: AuthUser, tenantId: string, regionId: string) => {
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('tenantId', tenantId);
    localStorage.setItem('regionId', regionId);
    setState({ user, tenantId, regionId });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('regionId');
    setState({ user: null, tenantId: '', regionId: '' });
  }, []);

  return (
    <Ctx.Provider value={{ ...state, isAuthenticated: !!state.user, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
