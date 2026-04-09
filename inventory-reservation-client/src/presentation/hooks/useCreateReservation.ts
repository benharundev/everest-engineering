import { useCallback, useState } from 'react';
import { container } from '../../infrastructure/container';
import type { Reservation } from '../../domain/entities/Reservation';

/**
 * useCreateReservation — drives the Create form use case.
 *
 * The component calls execute() and reads {loading, error, result}.
 * Toast and refresh side-effects happen automatically via EDA event handlers
 * registered in AppContext — the hook doesn't need to trigger them manually.
 */
export function useCreateReservation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Reservation | null>(null);

  const execute = useCallback(async (
    customerName: string,
    productId: string,
    quantity: number,
  ): Promise<Reservation | null> => {
    setLoading(true);
    setError(null);

    try {
      const r = await container.createReservation.execute(customerName, productId, quantity);
      setResult(r);
      return r;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  return { execute, loading, error, result, reset };
}
