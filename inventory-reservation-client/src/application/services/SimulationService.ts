import type { IReservationRepository } from '../../domain/interfaces/IReservationRepository';
import type { INameStore } from '../../domain/interfaces/INameStore';
import { uuid4 } from '../utils/uuid';

export type LogLevel = 'info' | 'success' | 'error' | 'warn' | 'dim';
export type Logger = (text: string, level?: LogLevel) => void;

/**
 * SimulationService — application service encapsulating all simulation scenarios.
 *
 * SRP: simulation logic lives here, not in the UI component.
 * DIP: depends on IReservationRepository and INameStore interfaces.
 * OCP: add a new scenario method without touching any component.
 */
export class SimulationService {
  constructor(
    private readonly repo: IReservationRepository,
    private readonly nameStore: INameStore,
  ) {}

  private makeUser(label: string): { userId: string; name: string } {
    const userId = uuid4();
    const name = label;
    this.nameStore.save(userId, name);
    return { userId, name };
  }

  // ── Concurrent Rush ─────────────────────────────────────────────────────────

  async runConcurrentRush(log: Logger): Promise<void> {
    const productId = `sim-${uuid4().slice(0, 6)}`;
    log(`Product: ${productId}`, 'dim');
    log('Firing 10 simultaneous reservations…', 'info');

    const promises = Array.from({ length: 10 }, (_, i) => {
      const { userId } = this.makeUser(`ConcurrentUser-${i + 1}`);
      return this.repo.create(productId, userId, 1)
        .then((r) => ({ ok: true as const, r, name: `ConcurrentUser-${i + 1}` }))
        .catch((e: Error) => ({ ok: false as const, e, name: `ConcurrentUser-${i + 1}` }));
    });

    const results = await Promise.all(promises);
    let ok = 0; let fail = 0;

    for (const res of results) {
      if (res.ok) {
        ok++;
        log(`  ✓ ${res.name} — reserved [${res.r.id.slice(0, 8)}]`, 'success');
      } else {
        fail++;
        log(`  ✕ ${res.name} — ${res.e.message}`, 'error');
      }
    }

    log('', 'dim');
    log(`Results: ${ok} succeeded, ${fail} rejected`, ok > 0 ? 'success' : 'warn');
    log(`Atomicity: ${fail === 0 ? 'all accepted (unlimited stock)' : 'some rejected (stock limited) ✓'}`, fail > 0 ? 'success' : 'info');
  }

  // ── Full Lifecycle ──────────────────────────────────────────────────────────

  async runLifecycle(log: Logger): Promise<void> {
    const productId = `sim-${uuid4().slice(0, 6)}`;
    const { userId } = this.makeUser('LifecycleUser');

    log('Step 1 — Create reservation', 'info');
    let res;
    try {
      res = await this.repo.create(productId, userId, 2);
      log(`  ✓ Created [${res.id.slice(0, 8)}] status=${res.status}`, 'success');
    } catch (e) {
      log(`  ✕ Create failed: ${(e as Error).message}`, 'error'); return;
    }

    log('Step 2 — Confirm reservation', 'info');
    try {
      const confirmed = await this.repo.confirm(res.id);
      log(`  ✓ Confirmed — status=${confirmed.status}`, 'success');
    } catch (e) {
      log(`  ✕ Confirm failed: ${(e as Error).message}`, 'error'); return;
    }

    log('Step 3 — Re-confirm (should fail — CONFIRMED→CONFIRMED invalid)', 'info');
    try {
      await this.repo.confirm(res.id);
      log(`  ✕ Unexpectedly accepted — state machine not enforced!`, 'error');
    } catch (e) {
      log(`  ✓ Correctly rejected: ${(e as Error).message}`, 'success');
    }

    log('Step 4 — Cancel confirmed (should fail)', 'info');
    try {
      await this.repo.cancel(res.id);
      log(`  ✕ Unexpectedly accepted`, 'error');
    } catch (e) {
      log(`  ✓ Correctly rejected: ${(e as Error).message}`, 'success');
    }
  }

  // ── Cancel Flow ─────────────────────────────────────────────────────────────

  async runCancelFlow(log: Logger): Promise<void> {
    const productId = `sim-${uuid4().slice(0, 6)}`;
    const { userId } = this.makeUser('CancelFlowUser');

    log('Step 1 — Create reservation', 'info');
    let res;
    try {
      res = await this.repo.create(productId, userId, 1);
      log(`  ✓ Created [${res.id.slice(0, 8)}]`, 'success');
    } catch (e) {
      log(`  ✕ Create failed: ${(e as Error).message}`, 'error'); return;
    }

    log('Step 2 — Cancel', 'info');
    try {
      const cancelled = await this.repo.cancel(res.id);
      log(`  ✓ Cancelled — status=${cancelled.status}`, 'success');
    } catch (e) {
      log(`  ✕ Cancel failed: ${(e as Error).message}`, 'error'); return;
    }

    log('Step 3 — Duplicate cancel (should fail)', 'info');
    try {
      await this.repo.cancel(res.id);
      log(`  ✕ Duplicate cancel accepted — bug!`, 'error');
    } catch (e) {
      log(`  ✓ Correctly rejected: ${(e as Error).message}`, 'success');
    }
  }

  // ── Expiry Guard ────────────────────────────────────────────────────────────

  async runExpireGuard(log: Logger): Promise<void> {
    const productId = `sim-${uuid4().slice(0, 6)}`;
    const { userId } = this.makeUser('ExpireGuardUser');

    log('Step 1 — Create + confirm a reservation', 'info');
    let res;
    try {
      res = await this.repo.create(productId, userId, 1);
      await this.repo.confirm(res.id);
      log(`  ✓ Confirmed [${res.id.slice(0, 8)}]`, 'success');
    } catch (e) {
      log(`  ✕ Setup failed: ${(e as Error).message}`, 'error'); return;
    }

    log('Step 2 — Re-confirm (simulate post-expire confirm)', 'info');
    try {
      await this.repo.confirm(res.id);
      log(`  ✕ Should have been rejected`, 'error');
    } catch (e) {
      log(`  ✓ Rejected correctly: ${(e as Error).message}`, 'success');
    }
  }

  // ── Bulk Create ─────────────────────────────────────────────────────────────

  async runBulk(log: Logger): Promise<void> {
    const productId = `sim-${uuid4().slice(0, 6)}`;
    log('Creating 20 reservations sequentially…', 'info');
    const start = Date.now();
    let ok = 0; let fail = 0;

    for (let i = 0; i < 20; i++) {
      const { userId } = this.makeUser(`BulkUser-${i + 1}`);
      try {
        await this.repo.create(productId, userId, 1);
        ok++;
        log(`  [${i + 1}/20] ✓ BulkUser-${i + 1}`, 'success');
      } catch (e) {
        fail++;
        log(`  [${i + 1}/20] ✕ BulkUser-${i + 1} — ${(e as Error).message}`, 'error');
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    log('', 'dim');
    log(`Done in ${elapsed}s — ${ok} ok, ${fail} failed`, 'success');
    log(`Throughput: ~${(20 / parseFloat(elapsed)).toFixed(1)} req/s (sequential)`, 'info');
  }

  // ── Stress Test ─────────────────────────────────────────────────────────────

  async runStress(log: Logger): Promise<void> {
    const productId = `sim-${uuid4().slice(0, 6)}`;

    log('Phase 1 — Create 20 reservations concurrently', 'info');
    const creates = await Promise.all(
      Array.from({ length: 20 }, (_, i) => {
        const { userId } = this.makeUser(`StressUser-${i + 1}`);
        return this.repo.create(productId, userId, 1)
          .then((r) => ({ ok: true as const, r }))
          .catch(() => ({ ok: false as const, r: null }));
      })
    );
    const created = creates.filter((c) => c.ok && c.r !== null).map((c) => c.r!);
    log(`  Created: ${created.length}/20`, created.length > 0 ? 'success' : 'error');

    if (created.length === 0) { log('Nothing to confirm/cancel — stopping.', 'warn'); return; }

    log('Phase 2 — Concurrently confirm first half, cancel second half', 'info');
    const half = Math.ceil(created.length / 2);
    const toConfirm = created.slice(0, half);
    const toCancel  = created.slice(half);

    const mixed = await Promise.all([
      ...toConfirm.map((r) => this.repo.confirm(r.id).then(() => true).catch(() => false)),
      ...toCancel.map((r)  => this.repo.cancel(r.id).then(() => true).catch(() => false)),
    ]);

    const confirmed = mixed.slice(0, toConfirm.length).filter(Boolean).length;
    const cancelled = mixed.slice(toConfirm.length).filter(Boolean).length;
    log(`  Confirmed: ${confirmed}/${toConfirm.length}`, 'success');
    log(`  Cancelled: ${cancelled}/${toCancel.length}`, 'info');
    log(`  Total concurrent operations: ${created.length + toConfirm.length + toCancel.length}`, 'dim');
  }
}
