export type ReservationStatus = 'ACTIVE' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export const ReservationStatusMeta: Record<
  ReservationStatus,
  { label: string; colorVar: string; pulsing: boolean }
> = {
  ACTIVE:    { label: 'Active',    colorVar: 'var(--green)',  pulsing: true  },
  CONFIRMED: { label: 'Confirmed', colorVar: 'var(--accent)', pulsing: false },
  CANCELLED: { label: 'Cancelled', colorVar: 'var(--yellow)', pulsing: false },
  EXPIRED:   { label: 'Expired',   colorVar: 'var(--red)',    pulsing: false },
};
