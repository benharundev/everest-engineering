export type ReservationStatus = 'ACTIVE' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type TabId = 'dashboard' | 'reservations' | 'create' | 'simulate' | 'settings';

export interface Reservation {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface StatusLog {
  id: string;
  reservationId: string;
  previousStatus: ReservationStatus | null;
  newStatus: ReservationStatus;
  changedAt: string;
  reason?: string;
}

export interface CreateReservationDto {
  productId: string;
  userId: string;
  quantity: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T;
}

export interface Stats {
  total: number;
  ACTIVE: number;
  CONFIRMED: number;
  CANCELLED: number;
  EXPIRED: number;
}
