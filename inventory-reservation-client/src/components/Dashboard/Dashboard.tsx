import { container } from '../../infrastructure/container';
import { useDashboard } from '../../presentation/hooks/useDashboard';
import { Badge } from '../shared/Badge';
import { ExpiryBar } from '../shared/ExpiryBar';
import { Spinner } from '../shared/Spinner';
import type { ReservationStatus } from '../../domain/value-objects/ReservationStatus';
import type { DashboardStats } from '../../application/use-cases/GetDashboardStatsUseCase';

const STAT_CONFIG: Array<{ key: keyof Omit<DashboardStats, 'recent'>; label: string; color: string; sub: string }> = [
  { key: 'total',     label: 'Total',     color: 'var(--accent)', sub: 'all time'     },
  { key: 'active',    label: 'Active',    color: 'var(--green)',  sub: 'holding stock' },
  { key: 'confirmed', label: 'Confirmed', color: 'var(--accent)', sub: 'sold'          },
  { key: 'cancelled', label: 'Cancelled', color: 'var(--yellow)', sub: 'released'      },
  { key: 'expired',   label: 'Expired',   color: 'var(--red)',    sub: 'timed out'     },
];

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub: string }) {
  return (
    <div className="card" style={{ padding: '20px 24px', borderTop: `2px solid ${color}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 80, background: `linear-gradient(270deg,${color}08,transparent)`, pointerEvents: 'none' }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>
    </div>
  );
}

export function Dashboard() {
  const { stats, loading } = useDashboard();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--text-muted)' }}>
        <Spinner size={18} /><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading metrics…</span>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
        {STAT_CONFIG.map(({ key, label, color, sub }) => (
          <StatCard key={key} label={label} value={stats?.[key as keyof typeof stats] as number ?? 0} color={color} sub={sub} />
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>Recent Reservations</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>latest 8</span>
        </div>
        {!stats?.recent.length ? (
          <div className="empty-state">No reservations yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>ID</th><th>Product</th><th>User</th><th>Qty</th><th>Status</th><th>Expires</th></tr></thead>
              <tbody>
                {stats.recent.map((r) => (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{r.id.slice(0, 8)}…</span></td>
                    <td><span style={{ fontWeight: 600 }}>{r.productName || r.productId}</span></td>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{container.nameStore.resolve(r.userId) ?? r.userId.slice(0, 8) + '…'}</span></td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.quantity}</span></td>
                    <td><Badge status={r.status as ReservationStatus} /></td>
                    <td>{r.isActive ? <ExpiryBar reservation={r} /> : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
