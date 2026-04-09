import { useState } from 'react';
import { container } from '../../infrastructure/container';
import { useReservations } from '../../presentation/hooks/useReservations';
import { useApp } from '../../context/AppContext';
import { Badge } from '../shared/Badge';
import { ExpiryBar } from '../shared/ExpiryBar';
import { Modal } from '../shared/Modal';
import { Spinner } from '../shared/Spinner';
import type { Reservation } from '../../domain/entities/Reservation';
import type { ReservationStatus } from '../../domain/value-objects/ReservationStatus';
import type { StatusLog } from '../../domain/interfaces/IReservationRepository';

const STATUSES: Array<ReservationStatus | ''> = ['', 'ACTIVE', 'CONFIRMED', 'CANCELLED', 'EXPIRED'];

export function ReservationsTab() {
  const { toast } = useApp();
  const {
    result, loading, actionId,
    statusFilter, setStatusFilter,
    offset, setOffset,
    totalPages, currentPage, limit,
    confirm, cancel, getLogs,
  } = useReservations();

  const [detailRes, setDetailRes]     = useState<Reservation | null>(null);
  const [logs, setLogs]               = useState<StatusLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [detailOpen, setDetailOpen]   = useState(false);

  const openDetail = async (r: Reservation) => {
    setDetailRes(r);
    setDetailOpen(true);
    setLogsLoading(true);
    const l = await getLogs(r.id);
    setLogs(l);
    setLogsLoading(false);
  };

  const handleConfirm = async (id: string) => {
    try {
      const updated = await confirm(id);
      if (detailRes?.id === id) setDetailRes(updated);
      toast('Reservation confirmed.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const updated = await cancel(id);
      if (detailRes?.id === id) setDetailRes(updated);
      toast('Reservation cancelled.', 'info');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {STATUSES.map((s) => (
          <button key={s || 'all'} className="btn btn-sm" onClick={() => setStatusFilter(s)}
            style={{
              background: statusFilter === s ? 'var(--accent-dim)' : 'var(--bg-card)',
              color: statusFilter === s ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${statusFilter === s ? 'rgba(58,236,255,0.4)' : 'var(--border)'}`,
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', fontWeight: 600,
            }}>
            {s || 'ALL'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          {result ? `${result.total} reservation${result.total !== 1 ? 's' : ''}` : '—'}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12, color: 'var(--text-muted)' }}>
            <Spinner size={16} /><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading…</span>
          </div>
        ) : !result?.data.length ? (
          <div className="empty-state">No reservations match this filter.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>ID</th><th>Product</th><th>User</th><th>Qty</th><th>Status</th><th>Expiry</th><th>Actions</th></tr></thead>
              <tbody>
                {result.data.map((r) => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(r)}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>{r.id.slice(0, 8)}…</span></td>
                    <td><span style={{ fontWeight: 600 }}>{r.productName || r.productId}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{container.nameStore.resolve(r.userId) ?? r.userId.slice(0, 8) + '…'}</span></td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.quantity}</span></td>
                    <td><Badge status={r.status as ReservationStatus} /></td>
                    <td>{r.isActive ? <ExpiryBar reservation={r} /> : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>—</span>}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {r.canConfirm && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-success" disabled={actionId === r.id} onClick={() => handleConfirm(r.id)}>
                            {actionId === r.id ? <Spinner size={11} color="var(--green)" /> : 'Confirm'}
                          </button>
                          <button className="btn btn-sm btn-danger" disabled={actionId === r.id} onClick={() => handleCancel(r.id)}>
                            {actionId === r.id ? <Spinner size={11} color="var(--red)" /> : 'Cancel'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {result && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button className="btn btn-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>← Prev</button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', padding: '0 8px' }}>{currentPage} / {totalPages}</span>
          <button className="btn btn-sm" disabled={offset + limit >= result.total} onClick={() => setOffset(offset + limit)}>Next →</button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Reservation ${detailRes?.id.slice(0, 8) ?? ''}…`} width={600}>
        {detailRes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {([
                ['ID', detailRes.id],
                ['Product', detailRes.productName || detailRes.productId],
                ['User', container.nameStore.resolve(detailRes.userId) ?? detailRes.userId],
                ['Quantity', String(detailRes.quantity)],
                ['Created', detailRes.createdAt.toLocaleString()],
                ['Expires', detailRes.expiresAt.toLocaleString()],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', wordBreak: 'break-all' }}>{v}</div>
                </div>
              ))}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                <Badge status={detailRes.status as ReservationStatus} />
              </div>
              {detailRes.isActive && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Remaining</div>
                  <ExpiryBar reservation={detailRes} />
                </div>
              )}
            </div>

            {detailRes.canConfirm && (
              <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-success" onClick={() => handleConfirm(detailRes.id)}>Confirm Reservation</button>
                <button className="btn btn-danger"  onClick={() => handleCancel(detailRes.id)}>Cancel Reservation</button>
              </div>
            )}

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Audit Log</div>
              {logsLoading ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-dim)' }}><Spinner size={12} /><span style={{ fontSize: 12 }}>Loading…</span></div>
              ) : logs.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>No log entries.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {logs.map((l) => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>{new Date(l.changedAt).toLocaleTimeString()}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--yellow)' }}>{l.previousStatus}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>→</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)' }}>{l.newStatus}</span>
                      {l.reason && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{l.reason}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
