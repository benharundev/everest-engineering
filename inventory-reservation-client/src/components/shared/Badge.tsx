import type { ReservationStatus } from '../../types';

const cfg: Record<ReservationStatus, { bg: string; color: string; border: string; label: string }> = {
  ACTIVE:    { bg: 'var(--green-dim)',  color: 'var(--green)',  border: 'rgba(0,209,122,0.3)',   label: 'ACTIVE' },
  CONFIRMED: { bg: 'var(--accent-dim)', color: 'var(--accent)', border: 'rgba(58,236,255,0.3)',  label: 'CONFIRMED' },
  CANCELLED: { bg: 'var(--yellow-dim)', color: 'var(--yellow)', border: 'rgba(255,181,32,0.3)',  label: 'CANCELLED' },
  EXPIRED:   { bg: 'var(--red-dim)',    color: 'var(--red)',    border: 'rgba(255,51,85,0.3)',   label: 'EXPIRED' },
};

export function Badge({ status }: { status: ReservationStatus }) {
  const s = cfg[status];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 9px',
      borderRadius: 20,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.06em',
      whiteSpace: 'nowrap',
    }}>
      {status === 'ACTIVE' && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--green)',
          animation: 'blink 1.4s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}
      {s.label}
    </span>
  );
}
