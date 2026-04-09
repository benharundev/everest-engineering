import { useApp } from '../../context/AppContext';

const iconMap = { success: '✓', error: '✕', info: '◆' };
const colorMap = {
  success: { bg: 'rgba(0,209,122,0.08)', border: 'rgba(0,209,122,0.3)', color: 'var(--green)' },
  error:   { bg: 'rgba(255,51,85,0.08)', border: 'rgba(255,51,85,0.3)',  color: 'var(--red)' },
  info:    { bg: 'rgba(58,236,255,0.08)', border: 'rgba(58,236,255,0.3)', color: 'var(--accent)' },
};

export function ToastStack() {
  const { toasts, dismissToast } = useApp();

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 1000,
      maxWidth: 360,
    }}>
      {toasts.map((t) => {
        const c = colorMap[t.type];
        return (
          <div
            key={t.id}
            className="slide-in"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
            }}
            onClick={() => dismissToast(t.id)}
          >
            <span style={{ color: c.color, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {iconMap[t.type]}
            </span>
            <span style={{ color: 'var(--text)', fontSize: 13, flex: 1, lineHeight: 1.5 }}>
              {t.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
