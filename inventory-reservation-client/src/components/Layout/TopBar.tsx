import { useApp } from '../../context/AppContext';

const TAB_LABELS: Record<string, string> = {
  dashboard:    'Dashboard',
  reservations: 'Reservations',
  create:       'New Reservation',
  simulate:     'Simulate',
  settings:     'Settings',
};

const TAB_DESCRIPTIONS: Record<string, string> = {
  dashboard:    'System overview and live metrics',
  reservations: 'Browse, confirm and cancel reservations',
  create:       'Reserve stock for a customer',
  simulate:     'Run concurrency and edge-case scenarios',
  settings:     'Configure API endpoint and preferences',
};

export function TopBar() {
  const { tab, online, triggerRefresh } = useApp();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header style={{
      height: 60,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.2,
        }}>
          {TAB_LABELS[tab]}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--text-muted)',
          marginTop: 1,
        }}>
          {TAB_DESCRIPTIONS[tab]}
        </div>
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '0.04em',
          }}>
            {timeStr}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-dim)',
            letterSpacing: '0.04em',
          }}>
            {dateStr}
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

        {/* Status pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 20,
          background: online ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `1px solid ${online ? 'rgba(0,209,122,0.3)' : 'rgba(255,51,85,0.3)'}`,
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: online ? 'var(--green)' : 'var(--red)',
            animation: online ? 'blink 1.4s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color: online ? 'var(--green)' : 'var(--red)',
            letterSpacing: '0.06em',
          }}>
            {online ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={triggerRefresh}
          title="Refresh data"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(58,236,255,0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          }}
        >
          ↻
        </button>
      </div>
    </header>
  );
}
