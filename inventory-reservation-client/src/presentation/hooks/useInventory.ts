import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { container } from '../../infrastructure/container';
import type { Inventory } from '../../domain/entities/Inventory';

/**
 * useInventory — drives inventory listing and seeding from the Settings tab.
 *
 * DIP: SettingsTab depends on this hook, never on the HTTP layer.
 * SRP: owns inventory list state and the seed action only.
 */
export function useInventory() {
  const { online, refreshTick } = useApp();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [seedingId, setSeedingId] = useState<string | null>(null);
  const [seedingAll, setSeedingAll] = useState(false);

  useEffect(() => {
    if (!online) return;
    container.seedInventory.getAll()
      .then(setInventory)
      .catch(() => {});
  }, [online, refreshTick]);

  const seed = useCallback(async (productId: string, name: string, totalStock: number): Promise<Inventory | null> => {
    setSeedingId(productId);
    try {
      const inv = await container.seedInventory.execute({ productId, name, totalStock });
      setInventory((prev) => {
        const exists = prev.find((x) => x.productId === productId);
        return exists
          ? prev.map((x) => x.productId === productId ? inv : x)
          : [...prev, inv];
      });
      return inv;
    } catch {
      return null;
    } finally {
      setSeedingId(null);
    }
  }, []);

  const seedAll = useCallback(async (
    products: Array<{ id: string; name: string; stock: number }>
  ): Promise<void> => {
    setSeedingAll(true);
    for (const p of products) {
      await seed(p.id, p.name, p.stock);
    }
    setSeedingAll(false);
  }, [seed]);

  const getRow = useCallback(
    (productId: string) => inventory.find((x) => x.productId === productId) ?? null,
    [inventory]
  );

  return { inventory, seedingId, seedingAll, seed, seedAll, getRow };
}
