import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { container } from '../../infrastructure/container';
import type { Reservation } from '../../domain/entities/Reservation';
import type { ReservationStatus } from '../../domain/value-objects/ReservationStatus';
import type { PaginatedReservations, StatusLog } from '../../domain/interfaces/IReservationRepository';

const LIMIT = 15;

/**
 * useReservations — manages paginated list state + confirm/cancel actions.
 *
 * DIP: ReservationsTab only imports this hook, never the HTTP layer.
 * SRP: this hook owns list state, pagination, and action dispatch.
 */
export function useReservations() {
  const { refreshTick } = useApp();
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('');
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<PaginatedReservations | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    setLoading(true);
    container.getReservations
      .execute({ status: statusFilter || undefined, offset, limit: LIMIT })
      .then((r) => { if (mounted.current) { setResult(r); setLoading(false); } })
      .catch(() => { if (mounted.current) setLoading(false); });
  }, [statusFilter, offset, refreshTick]);

  const confirm = useCallback(async (id: string): Promise<Reservation> => {
    setActionId(id);
    try {
      const updated = await container.confirmReservation.execute(id);
      setResult((prev) => prev
        ? { ...prev, data: prev.data.map((r) => r.id === id ? updated : r) }
        : prev
      );
      return updated;
    } finally {
      if (mounted.current) setActionId(null);
    }
  }, []);

  const cancel = useCallback(async (id: string): Promise<Reservation> => {
    setActionId(id);
    try {
      const updated = await container.cancelReservation.execute(id);
      setResult((prev) => prev
        ? { ...prev, data: prev.data.map((r) => r.id === id ? updated : r) }
        : prev
      );
      return updated;
    } finally {
      if (mounted.current) setActionId(null);
    }
  }, []);

  const getLogs = useCallback((id: string): Promise<StatusLog[]> => {
    return container.getReservations.getLogs(id);
  }, []);

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 1;
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return {
    result, loading, actionId,
    statusFilter, setStatusFilter: (s: ReservationStatus | '') => { setStatusFilter(s); setOffset(0); },
    offset, setOffset,
    totalPages, currentPage, limit: LIMIT,
    confirm, cancel, getLogs,
  };
}
