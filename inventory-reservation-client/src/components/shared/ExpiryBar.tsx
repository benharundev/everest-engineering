import { useEffect, useState } from 'react';
import type { Reservation } from '../../domain/entities/Reservation';

interface ExpiryBarProps {
  reservation: Reservation;
}

export function ExpiryBar({ reservation }: ExpiryBarProps) {
  const [pct, setPct] = useState(() => reservation.expiryPercentElapsed);
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      setPct(reservation.expiryPercentElapsed);
      const msLeft = reservation.timeRemainingMs;
      if (msLeft <= 0) { setRemaining('expired'); return; }
      const s = Math.ceil(msLeft / 1000);
      setRemaining(s < 60 ? `${s}s` : `${Math.ceil(s / 60)}m`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [reservation]);

  const barColor = pct > 80 ? 'var(--red)' : pct > 55 ? 'var(--yellow)' : 'var(--green)';
  const glowColor = pct > 80 ? 'rgba(255,51,85,0.4)' : pct > 55 ? 'rgba(255,181,32,0.4)' : 'rgba(0,209,122,0.4)';

  return (
    <div style={{ minWidth: 90 }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: barColor,
        fontWeight: 600,
        marginBottom: 4,
        textAlign: 'right',
      }}>
        {remaining}
      </div>
      <div style={{
        height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: 2,
          boxShadow: `0 0 6px ${glowColor}`,
          transition: 'width 1s linear, background 0.5s',
        }} />
      </div>
    </div>
  );
}
