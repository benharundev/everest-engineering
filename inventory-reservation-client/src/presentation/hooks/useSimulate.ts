import { useCallback, useRef, useState } from 'react';
import { container } from '../../infrastructure/container';
import type { LogLevel } from '../../application/services/SimulationService';

export interface LogLine {
  id: number;
  level: LogLevel;
  text: string;
}

let lineId = 0;

export type ScenarioId = 'concurrent' | 'lifecycle' | 'cancel-flow' | 'expire-guard' | 'bulk' | 'stress';

/**
 * useSimulate — drives the SimulationService from the UI.
 *
 * DIP: SimulateTab only sees this hook, never the SimulationService directly.
 * SRP: this hook owns log state and running state only.
 */
export function useSimulate() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [running, setRunning] = useState<ScenarioId | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const log = useCallback((text: string, level: LogLevel = 'info') => {
    setLines((prev) => [...prev, { id: lineId++, level, text }].slice(-200));
    setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 30);
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const runScenario = useCallback(async (id: ScenarioId) => {
    setRunning(id);
    clear();
    log(`▶ Running: ${id}`, 'dim');
    log('─'.repeat(52), 'dim');

    try {
      const svc = container.simulation;
      if (id === 'concurrent')   await svc.runConcurrentRush(log);
      if (id === 'lifecycle')    await svc.runLifecycle(log);
      if (id === 'cancel-flow')  await svc.runCancelFlow(log);
      if (id === 'expire-guard') await svc.runExpireGuard(log);
      if (id === 'bulk')         await svc.runBulk(log);
      if (id === 'stress')       await svc.runStress(log);
    } catch (e) {
      log(`Unexpected error: ${(e as Error).message}`, 'error');
    }

    log('─'.repeat(52), 'dim');
    log('✓ Scenario complete.', 'success');
    setRunning(null);
  }, [clear, log]);

  return { lines, running, scrollRef, runScenario, clear };
}
