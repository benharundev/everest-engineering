import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useCreateReservation } from '../../presentation/hooks/useCreateReservation';
import { container } from '../../infrastructure/container';
import { Badge } from '../shared/Badge';
import { ExpiryBar } from '../shared/ExpiryBar';
import { Spinner } from '../shared/Spinner';
import type { ReservationStatus } from '../../domain/value-objects/ReservationStatus';

const DEMO_PRODUCTS = [
  { id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5', name: 'Alpha Widget Pro' },
  { id: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6', name: 'Beta Module X' },
  { id: 'c3d4e5f6-a7b8-4c9d-8e1f-a2b3c4d5e6f7', name: 'Gamma Controller' },
  { id: 'd4e5f6a7-b8c9-4d0e-af2a-b3c4d5e6f7a8', name: 'Delta Sensor Unit' },
];

export function CreateForm() {
  const { setTab } = useApp();
  const { execute, loading, error, result, reset } = useCreateReservation();

  const [fullName,   setFullName]   = useState('');
  const [productId,  setProductId]  = useState('');
  const [quantity,   setQuantity]   = useState(1);

  const fillDemo = () => {
    const p = DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)];
    setFullName('Sarah Johnson');
    setProductId(p.id);
    setQuantity(Math.ceil(Math.random() * 3));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !productId.trim()) return;
    await execute(fullName.trim(), productId.trim(), quantity);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      <div className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Reserve Stock</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Creates a 2-minute hold on inventory</div>
          </div>
          <button type="button" className="btn btn-sm" onClick={fillDemo} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>⟳ Fill Demo</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Customer Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sarah Johnson" required style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Product</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {DEMO_PRODUCTS.map((p) => (
                <button key={p.id} type="button" className="btn btn-sm" onClick={() => setProductId(p.id)}
                  style={{ background: productId === p.id ? 'var(--accent-dim)' : 'var(--bg-base)', color: productId === p.id ? 'var(--accent)' : 'var(--text-muted)', border: `1px solid ${productId === p.id ? 'rgba(58,236,255,0.4)' : 'var(--border)'}`, fontSize: 11 }}>
                  {p.name}
                </button>
              ))}
            </div>
            <input type="text" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="or type product ID manually" style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Quantity</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="btn btn-sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>−</button>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 90, textAlign: 'center' }} />
              <button type="button" className="btn btn-sm" onClick={() => setQuantity(quantity + 1)} style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>+</button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              ✕ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><Spinner size={14} color="var(--bg-base)" /> Creating…</> : '⊕ Create Reservation'}
          </button>
        </form>
      </div>

      {result && (
        <div className="card fade-in" style={{ marginTop: 20, padding: 24, borderTop: '2px solid var(--green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>Reservation Created</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            {([
              ['Reservation ID', result.id],
              ['Product', result.productName || result.productId],
              ['Customer', container.nameStore.resolve(result.userId) ?? result.userId],
              ['User ID', result.userId],
              ['Quantity', String(result.quantity)],
              ['Created', result.createdAt.toLocaleString()],
              ['Expires', result.expiresAt.toLocaleString()],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
              <Badge status={result.status as ReservationStatus} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Time Remaining</div>
            <ExpiryBar reservation={result} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => { reset(); setFullName(''); setProductId(''); setQuantity(1); }}>+ New Reservation</button>
            <button className="btn btn-sm btn-success" onClick={() => setTab('reservations')}>View All →</button>
          </div>
        </div>
      )}
    </div>
  );
}
