import type { IInventoryRepository, UpsertInventoryParams } from '../../domain/interfaces/IInventoryRepository';
import { Inventory } from '../../domain/entities/Inventory';
import type { HttpClient } from '../http/HttpClient';

interface InventoryDto {
  productId: string;
  name: string;
  totalStock: number;
  confirmedSales: number;
  activeReservations: number;
  updatedAt: string;
}

export class ApiInventoryRepository implements IInventoryRepository {
  constructor(private readonly http: HttpClient) {}

  private toEntity(dto: InventoryDto): Inventory {
    return new Inventory(
      dto.productId,
      dto.name,
      dto.totalStock,
      dto.confirmedSales,
      dto.activeReservations,
      new Date(dto.updatedAt),
    );
  }

  async getAll(): Promise<Inventory[]> {
    const r = await this.http.request<InventoryDto[]>('GET', '/inventory');
    if (!r.ok) return [];
    return r.data.map((d) => this.toEntity(d));
  }

  async upsert(params: UpsertInventoryParams): Promise<Inventory> {
    const r = await this.http.request<InventoryDto>('POST', '/inventory', params);
    if (!r.ok) {
      const raw = (r.data as unknown as Record<string, unknown>)?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : (raw as string) ?? `HTTP ${r.status}`;
      throw new Error(msg);
    }
    return this.toEntity(r.data);
  }
}
