/**
 * INameStore — DIP abstraction for UUID → full name persistence.
 * ISP: dedicated interface, not mixed into any repository.
 */
export interface INameStore {
  save(userId: string, name: string): void;
  resolve(userId: string): string | null;
  getAll(): Record<string, string>;
  clear(): void;
}
