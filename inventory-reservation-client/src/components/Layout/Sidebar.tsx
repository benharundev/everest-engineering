import { useApp } from '../../context/AppContext';
import type { TabId } from '../../types';

interface NavItem {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const NAV: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',     icon: '◈', description: 'Overview & stats' },
  { id: 'reservations', label: 'Reservations',  icon: '⊟', description: 'Browse & manage' },
  { id: 'create',       label: 'New Reserve',   icon: '⊕', description: 'Create reservation' },
  { id: 'simulate',     label: 'Simulate',      icon: '⟳', description: 'Stress & edge cases' },
  { id: 'settings',     label: 'Settings',      icon: '⊙', description: 'API configuration' },
];

export function Sidebar() {
  const { tab, setTab, online } = useApp();

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--accent)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Inventory
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginTop: 2,
        }}>
          Reserve · System
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 12,
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: online ? 'var(--green)' : 'var(--red)',
            boxShadow: online ? '0 0 8px var(--green)' : '0 0 8px var(--red)',
            animation: online ? 'blink 1.4s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: online ? 'var(--green)' : 'var(--red)',
            fontWeight: 600,
          }}>
            {online ? 'API ONLINE' : 'API OFFLINE'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.15s, color 0.15s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                }
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  height: '60%',
                  width: 2,
                  borderRadius: 2,
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px var(--accent)',
                }} />
              )}
              <span style={{
                fontSize: 16,
                width: 20,
                textAlign: 'center',
                flexShrink: 0,
                color: active ? 'var(--accent)' : 'inherit',
              }}>
                {item.icon}
              </span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  lineHeight: 1.2,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10,
                  color: active ? 'rgba(58,236,255,0.6)' : 'var(--text-dim)',
                  marginTop: 1,
                }}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-dim)',
          letterSpacing: '0.05em',
        }}>
          v1.0.0 · Everest Engineering
        </div>
      </div>
    </aside>
  );
}
