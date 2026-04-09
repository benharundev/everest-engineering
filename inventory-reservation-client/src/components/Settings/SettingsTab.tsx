import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useInventory } from '../../presentation/hooks/useInventory';
import { container } from '../../infrastructure/container';
import { Spinner } from '../shared/Spinner';

const DEMO_PRODUCTS = [
  { id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5', name: 'Alpha Widget Pro' },
  { id: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6', name: 'Beta Module X' },
  { id: 'c3d4e5f6-a7b8-4c9d-8e1f-a2b3c4d5e6f7', name: 'Gamma Controller' },
  { id: 'd4e5f6a7-b8c9-4d0e-af2a-b3c4d5e6f7a8', name: 'Delta Sensor Unit' },
];

export function SettingsTab() {
  const { apiBase, setApiBase, online, toast } = useApp();
  const [url, setUrl] = useState(apiBase);
  const [testing, setTesting] = useState(false);
  const [stockValues, setStockValues] = useState<Record<string, number>>(
    Object.fromEntries(DEMO_PRODUCTS.map((p) => [p.id, 100]))
  );
  const [nameCount, setNameCount] = useState(() => Object.keys(container.nameStore.getAll()).length);

  const { seedingId, seedingAll, seed, seedAll, getRow } = useInventory();

  const save = () => { setApiBase(url); toast('API base URL saved.', 'success'); };

  const test = async () => {
    setTesting(true);
    try {
      const res = await fetch(url.replace(/\/$/, '') + '/reservations?limit=1');
      toast(res.ok || res.status < 500 ? 'Connection successful!' : `Server responded with ${res.status}`, res.ok ? 'success' : 'error');
    } catch {
      toast('Connection failed — check URL and CORS settings.', 'error');
    }
    setTesting(false);
  };

  const clearNames = () => {
    container.nameStore.clear();
    setNameCount(0);
    toast('Name cache cleared.', 'info');
  };

  const handleSeedAll = async () => {
    await seedAll(DEMO_PRODUCTS.map((p) => ({ id: p.id, name: p.name, stock: stockValues[p.id] ?? 100 })));
    toast('All demo products seeded.', 'success');
  };

  const nameMap = container.nameStore.getAll();

  return (
    <div className="fade-in" style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Seed Inventory */}
      <div className="card" style={{ padding: 24, borderTop: '2px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>Seed Demo Inventory</div>
          <button className="btn btn-sm btn-primary" onClick={handleSeedAll} disabled={seedingAll || !online} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {seedingAll ? <><Spinner size={11} color="var(--bg-base)" /> Seeding…</> : '⊕ Seed All'}
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
          Products must exist in the inventory table before reservations can be made.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DEMO_PRODUCTS.map((p) => {
            const row = getRow(p.id);
            const busy = seedingId === p.id || seedingAll;
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 8, border: `1px solid ${row ? 'rgba(0,209,122,0.25)' : 'var(--border)'}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>{p.id.slice(0, 18)}…</div>
                  {row && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', marginTop: 4 }}>✓ seeded · avail={row.availableStock}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button className="btn btn-sm" onClick={() => setStockValues((v) => ({ ...v, [p.id]: Math.max(1, (v[p.id] ?? 100) - 10) }))} style={{ width: 28, padding: 0, textAlign: 'center' }}>−</button>
                  <input type="number" min={1} value={stockValues[p.id] ?? 100} onChange={(e) => setStockValues((v) => ({ ...v, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ width: 60, textAlign: 'center', padding: '4px 6px' }} />
                  <button className="btn btn-sm" onClick={() => setStockValues((v) => ({ ...v, [p.id]: (v[p.id] ?? 100) + 10 }))} style={{ width: 28, padding: 0, textAlign: 'center' }}>+</button>
                </div>
                <button className="btn btn-sm btn-success" disabled={busy || !online} onClick={() => seed(p.id, p.name, stockValues[p.id] ?? 100)} style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 72, justifyContent: 'center' }}>
                  {busy ? <Spinner size={11} color="var(--green)" /> : row ? '↻ Update' : '⊕ Seed'}
                </button>
              </div>
            );
          })}
        </div>
        {!online && <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)' }}>✕ API offline — connect to the backend first</div>}
      </div>

      {/* API Config */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>API Endpoint</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Configure the NestJS backend URL</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Base URL</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:3000" style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={save}>Save</button>
          <button className="btn" onClick={test} disabled={testing} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {testing ? <><Spinner size={13} /> Testing…</> : '⟳ Test Connection'}
          </button>
        </div>
        <div style={{ marginTop: 16, padding: '10px 14px', background: online ? 'var(--green-dim)' : 'rgba(255,51,85,0.08)', border: `1px solid ${online ? 'rgba(0,209,122,0.3)' : 'rgba(255,51,85,0.3)'}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: online ? 'var(--green)' : 'var(--red)', animation: online ? 'blink 1.4s ease-in-out infinite' : 'none', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: online ? 'var(--green)' : 'var(--red)' }}>{online ? `Connected to ${apiBase}` : `Cannot reach ${apiBase}`}</span>
        </div>
      </div>

      {/* Name Cache */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Customer Name Cache</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Maps UUID → full name (LocalStorageNameStore)</div>
        <div style={{ padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 14, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
          {nameCount} name{nameCount !== 1 ? 's' : ''} cached
        </div>
        {nameCount > 0 && (
          <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 14 }}>
            {Object.entries(nameMap).map(([id, name]) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{id.slice(0, 16)}…</span>
                <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{name}</span>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-sm btn-danger" onClick={clearNames} disabled={nameCount === 0}>Clear Name Cache</button>
      </div>

      {/* API Reference */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>API Reference</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([
            ['POST',   '/inventory',               'Seed / update product stock'],
            ['GET',    '/inventory',               'List all products'],
            ['POST',   '/reservations',            'Create reservation'],
            ['GET',    '/reservations',            'List (paginated, filterable)'],
            ['GET',    '/reservations/:id',        'Get single reservation'],
            ['POST',   '/reservations/:id/confirm','Confirm reservation'],
            ['DELETE', '/reservations/:id',        'Cancel reservation'],
            ['GET',    '/reservations/:id/logs',   'Audit log'],
          ] as [string, string, string][]).map(([method, path, desc]) => (
            <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: method === 'POST' ? 'var(--green)' : method === 'DELETE' ? 'var(--red)' : 'var(--accent)', minWidth: 42, letterSpacing: '0.05em' }}>{method}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', flex: 1 }}>{path}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
