import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { TabId } from '../types';
import { checkHealth } from '../infrastructure/container';
import { registerToastHandler } from '../events/handlers/ToastHandler';
import { registerRefreshHandler } from '../events/handlers/RefreshHandler';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextValue {
  tab: TabId;
  setTab: (t: TabId) => void;
  apiBase: string;
  setApiBase: (url: string) => void;
  online: boolean;
  toast: (message: string, type?: Toast['type']) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  refreshTick: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<TabId>('dashboard');
  const [apiBase, setApiBaseState] = useState(() => localStorage.getItem('api_base') ?? 'http://localhost:3000');
  const [online, setOnline] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const toastId = useRef(0);

  const setApiBase = useCallback((url: string) => {
    const clean = url.replace(/\/$/, '');
    localStorage.setItem('api_base', clean);
    setApiBaseState(clean);
  }, []);

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerRefresh = useCallback(() => setRefreshTick((n) => n + 1), []);

  // Wire EDA handlers — toast + refresh react to domain events from use cases
  useEffect(() => {
    const cleanupToast   = registerToastHandler(toast);
    const cleanupRefresh = registerRefreshHandler(triggerRefresh);
    return () => { cleanupToast(); cleanupRefresh(); };
  }, [toast, triggerRefresh]);

  // Combined health check + auto-refresh tick every 10s (single timer to avoid throttling)
  useEffect(() => {
    const tick = async () => {
      const ok = await checkHealth();
      setOnline(ok);
      setRefreshTick((n) => n + 1);
    };
    tick();
    const iv = setInterval(tick, 10000);
    return () => clearInterval(iv);
  }, [apiBase]);

  return (
    <AppContext.Provider value={{ tab, setTab, apiBase, setApiBase, online, toast, toasts, dismissToast, refreshTick, triggerRefresh }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
