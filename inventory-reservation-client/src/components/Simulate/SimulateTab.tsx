import { useSimulate } from '../../presentation/hooks/useSimulate';
import { Spinner } from '../shared/Spinner';
import type { ScenarioId } from '../../presentation/hooks/useSimulate';
import type { LogLevel } from '../../application/services/SimulationService';

interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  icon: string;
}

const SCENARIOS: Scenario[] = [
  { id: 'concurrent',   label: 'Concurrent Rush',  icon: '⚡', description: '10 simultaneous requests — tests atomicity' },
  { id: 'lifecycle',    label: 'Full Lifecycle',   icon: '⟳', description: 'Reserve → Confirm → re-confirm (should fail) → cancel (should fail)' },
  { id: 'cancel-flow',  label: 'Cancel Flow',      icon: '✕', description: 'Reserve → Cancel → duplicate cancel (should fail)' },
  { id: 'expire-guard', label: 'Expiry Guard',     icon: '⊘', description: 'Confirm a CONFIRMED reservation → InvalidStateError' },
  { id: 'bulk',         label: 'Bulk Create',      icon: '⊞', description: 'Create 20 reservations sequentially — throughput measurement' },
  { id: 'stress',       label: 'Stress Test',      icon: '◈', description: '50 concurrent mixed operations (create + confirm + cancel)' },
];

const LEVEL_COLOR: Record<LogLevel, string> = {
  info:    'var(--text)',
  success: 'var(--green)',
  error:   'var(--red)',
  warn:    'var(--yellow)',
  dim:     'var(--text-dim)',
};

export function SimulateTab() {
  const { lines, running, scrollRef, runScenario, clear } = useSimulate();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
        {SCENARIOS.map((s) => {
          const isRunning = running === s.id;
          const anyRunning = running !== null;
          return (
            <div key={s.id} className="card"
              style={{ padding: '16px 18px', cursor: anyRunning ? 'default' : 'pointer', opacity: anyRunning && !isRunning ? 0.5 : 1, borderTop: isRunning ? '2px solid var(--accent)' : '2px solid transparent', transition: 'opacity .2s,border-color .2s' }}
              onClick={() => !anyRunning && runScenario(s.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 18, color: isRunning ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {isRunning ? <Spinner size={16} /> : s.icon}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: isRunning ? 'var(--accent)' : 'var(--text)' }}>{s.label}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{s.description}</p>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Console Output</span>
            {running && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Spinner size={10} /><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>running…</span></span>}
          </div>
          <button className="btn btn-sm" onClick={clear} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>clear</button>
        </div>
        <div ref={scrollRef} style={{ height: 340, overflowY: 'auto', padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, background: 'var(--bg-base)' }}>
          {lines.length === 0 ? (
            <span style={{ color: 'var(--text-dim)' }}>Click a scenario above to run it…</span>
          ) : (
            lines.map((l) => <div key={l.id} style={{ color: LEVEL_COLOR[l.level] }}>{l.text}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
