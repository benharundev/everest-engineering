import type { INameStore } from '../../domain/interfaces/INameStore';

/**
 * LocalStorageNameStore — implements INameStore using localStorage.
 *
 * DIP: application layer depends on INameStore, not this class.
 * SRP: only persists UUID → name mappings.
 *
 * Swappable: replace with SessionStorageNameStore or InMemoryNameStore
 * without touching any use case.
 */
export class LocalStorageNameStore implements INameStore {
  private static readonly KEY = 'userNameMap';

  getAll(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(LocalStorageNameStore.KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  private persist(map: Record<string, string>): void {
    try {
      localStorage.setItem(LocalStorageNameStore.KEY, JSON.stringify(map));
    } catch { /* ignore quota errors */ }
  }

  save(userId: string, name: string): void {
    const map = this.getAll();
    map[userId] = name;
    this.persist(map);
  }

  resolve(userId: string): string | null {
    return this.getAll()[userId] ?? null;
  }

  clear(): void {
    localStorage.removeItem(LocalStorageNameStore.KEY);
  }
}
