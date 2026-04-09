export function Spinner({ size = 16, color = 'var(--accent)' }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `2px solid rgba(255,255,255,0.1)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
      flexShrink: 0,
    }} />
  );
}

// inject spin keyframe once
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
