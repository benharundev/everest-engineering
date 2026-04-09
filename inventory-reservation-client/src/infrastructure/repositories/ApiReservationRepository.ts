import type { IReservationRepository, GetReservationsParams, PaginatedReservations, StatusLog } from '../../domain/interfaces/IReservationRepository';
import type { Reservation as ReservationEntity } from '../../domain/entities/Reservation';
import { Reservation } from '../../domain/entities/Reservation';
import type { ReservationStatus } from '../../domain/value-objects/ReservationStatus';
import { OutOfStockError, InvalidStateError, NotFoundError } from '../../domain/exceptions';
import type { HttpClient } from '../http/HttpClient';

interface ReservationDto {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
}

/**
 * ApiReservationRepository — LSP: safely substitutable for IReservationRepository.
 * DIP: ReservationService depends on the interface, not this class.
 *
 * Responsibility:
 *   - Map HTTP responses to domain Reservation entities
 *   - Map HTTP error codes to domain exceptions (OutOfStockError, InvalidStateError)
 *   - Hide all HTTP/JSON concerns from the application layer
 */
export class ApiReservationRepository implements IReservationRepository {
  constructor(private readonly http: HttpClient) {}

  private toEntity(dto: ReservationDto): ReservationEntity {
    return new Reservation(
      dto.id,
      dto.productId,
      dto.productName,
      dto.userId,
      dto.quantity,
      dto.status,
      new Date(dto.expiresAt),
      new Date(dto.createdAt),
    );
  }

  private throwDomainError(data: unknown, status: number): never {
    const raw = (data as Record<string, unknown>)?.message;
    const msg = Array.isArray(raw) ? raw.join(', ') : (raw as string) ?? `HTTP ${status}`;

    if (status === 404) throw new NotFoundError(msg);
    if (status === 409) {
      if (msg.toLowerCase().includes('stock')) throw new OutOfStockError(msg);
      throw new InvalidStateError(msg);
    }
    throw new Error(msg);
  }

  async getAll(params: GetReservationsParams): Promise<PaginatedReservations> {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    q.set('offset', String(params.offset ?? 0));
    q.set('limit',  String(params.limit  ?? 20));

    const r = await this.http.request<{ data: ReservationDto[]; total: number; offset: number; limit: number }>(
      'GET', `/reservations?${q}`
    );
    if (!r.ok) this.throwDomainError(r.data, r.status);

    return {
      data:   r.data.data.map((d) => this.toEntity(d)),
      total:  r.data.total,
      offset: r.data.offset,
      limit:  r.data.limit,
    };
  }

  async getById(id: string): Promise<ReservationEntity> {
    const r = await this.http.request<ReservationDto>('GET', `/reservations/${id}`);
    if (!r.ok) this.throwDomainError(r.data, r.status);
    return this.toEntity(r.data);
  }

  async create(productId: string, userId: string, quantity: number): Promise<ReservationEntity> {
    const r = await this.http.request<ReservationDto>('POST', '/reservations', { productId, userId, quantity });
    if (!r.ok) this.throwDomainError(r.data, r.status);
    return this.toEntity(r.data);
  }

  async confirm(id: string): Promise<ReservationEntity> {
    const r = await this.http.request<ReservationDto>('POST', `/reservations/${id}/confirm`);
    if (!r.ok) this.throwDomainError(r.data, r.status);
    return this.toEntity(r.data);
  }

  async cancel(id: string): Promise<ReservationEntity> {
    const r = await this.http.request<ReservationDto>('DELETE', `/reservations/${id}`);
    if (!r.ok) this.throwDomainError(r.data, r.status);
    return this.toEntity(r.data);
  }

  async getLogs(id: string): Promise<StatusLog[]> {
    const r = await this.http.request<StatusLog[]>('GET', `/reservations/${id}/logs`);
    if (!r.ok) this.throwDomainError(r.data, r.status);
    return r.data;
  }
}
