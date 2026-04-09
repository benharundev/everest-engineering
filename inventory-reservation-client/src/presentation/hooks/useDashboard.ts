import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { container } from '../../infrastructure/container';
import type { DashboardStats } from '../../application/use-cases/GetDashboardStatsUseCase';

/**
 * useDashboard — bridges GetDashboardStatsUseCase to React state.
 *
 * DIP: Dashboard component depends on this hook (abstraction),
 *      not on the HTTP client or API directly.
 */
export function useDashboard() {
  const { refreshTick } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    container.getDashboardStats.execute()
      .then((s) => { if (!cancelled) { setStats(s); setLoading(false); } })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [refreshTick]);

  return { stats, loading, error };
}
