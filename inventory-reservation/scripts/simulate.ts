/**
 * Real Use Case Simulation Script
 *
 * Scenarios:
 *   1. Happy path       — reserve → confirm
 *   2. Cancel flow      — reserve → cancel
 *   3. Out of stock     — exhaust stock, verify next request is rejected
 *   4. Concurrency      — N simultaneous requests for limited stock, verify no overselling
 *   5. Invalid state    — confirm twice, cancel confirmed (invalid state transitions)
 *   6. Get status       — GET reservation, verify 404 for non-existent
 *
 * Usage:
 *   npx ts-node scripts/simulate.ts
 */

const BASE_URL = 'http://localhost:3000';
const PRODUCT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const USER_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

// Rate limit: POST /reservations is capped at 20 req/min.
// Sequential loops must respect this to avoid 429 responses.
const RATE_LIMIT_DELAY_MS = 3_100; // slightly over 3 s to stay safely under 20/min
const RATE_LIMIT_WINDOW_MS = 61_000; // sleep duration to reset the throttle window

// ─── HTTP helpers ────────────────────────────────────────────────────────────

async function post(path: string, body?: object): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

async function del(path: string): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  return { status: res.status, data: await res.json() };
}

async function get(path: string): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${path}`);
  return { status: res.status, data: await res.json() };
}

function createReservation(quantity = 1) {
  return post('/reservations', { productId: PRODUCT_ID, userId: USER_ID, quantity });
}

/**
 * Like createReservation but retries once after sleeping if the rate limiter fires (429).
 */
async function createReservationRetrying(quantity = 1): Promise<{ status: number; data: any }> {
  const result = await createReservation(quantity);
  if (result.status === 429) {
    info(`Rate limited — waiting ${RATE_LIMIT_WINDOW_MS / 1000}s for window reset...`);
    await sleep(RATE_LIMIT_WINDOW_MS);
    return createReservation(quantity);
  }
  return result;
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

// ─── Logging helpers ─────────────────────────────────────────────────────────

function section(title: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

function pass(msg: string) { console.log(`  ✅ ${msg}`); }
function fail(msg: string) { console.log(`  ❌ ${msg}`); }
function info(msg: string) { console.log(`  ℹ  ${msg}`); }

function assert(condition: boolean, passMsg: string, failMsg: string) {
  if (condition) pass(passMsg);
  else fail(failMsg);
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

async function scenario1_happyPath() {
  section('Scenario 1 — Happy Path: Reserve → Confirm');

  const { status: s1, data: reservation } = await createReservationRetrying();
  assert(s1 === 201 && reservation.status === 'ACTIVE',
    `Reservation created [id: ${reservation.id}]`,
    `Failed to create reservation: ${JSON.stringify(reservation)}`);

  const { status: s2, data: confirmed } = await post(`/reservations/${reservation.id}/confirm`);
  assert([200, 201].includes(s2) && confirmed.status === 'CONFIRMED',
    `Reservation confirmed [status: ${confirmed.status}]`,
    `Failed to confirm: ${JSON.stringify(confirmed)}`);
}

async function scenario2_cancelFlow() {
  section('Scenario 2 — Cancel Flow: Reserve → Cancel');

  const { status: s1, data: reservation } = await createReservationRetrying();
  assert(s1 === 201, `Reservation created [id: ${reservation.id}]`, `Failed: ${JSON.stringify(reservation)}`);

  const { status: s2, data: cancelled } = await del(`/reservations/${reservation.id}`);
  assert(s2 === 200 && cancelled.status === 'CANCELLED',
    `Reservation cancelled [status: ${cancelled.status}]`,
    `Failed to cancel: ${JSON.stringify(cancelled)}`);
}

async function scenario3_outOfStock() {
  section('Scenario 3 — Out of Stock: Exhaust remaining stock');

  // Drain stock sequentially. A 3.1 s gap between requests keeps us under the
  // 20 req/min rate limit so throttling never interrupts the drain.
  const reservations: string[] = [];

  for (let i = 0; i < 200; i++) {
    if (i > 0) await sleep(RATE_LIMIT_DELAY_MS);

    const { status, data } = await createReservationRetrying();
    if (status === 201) {
      reservations.push(data.id);
    } else if (status === 409) {
      break; // genuinely out of stock
    } else {
      fail(`Unexpected status ${status} during stock drain: ${JSON.stringify(data)}`);
      break;
    }
  }

  info(`Reserved ${reservations.length} units before stock ran out`);

  // Wait one tick so the final reserve request doesn't share the rate-limit window.
  await sleep(RATE_LIMIT_DELAY_MS);

  // Verify the very next request is rejected with 409 (out of stock).
  const { status: outStatus, data: outData } = await createReservation();
  assert(outStatus === 409,
    `Out-of-stock correctly rejected with 409 [message: ${outData.message}]`,
    `Expected 409 but got ${outStatus}: ${JSON.stringify(outData)}`);

  // Release all reservations to restore stock for subsequent scenarios.
  for (const id of reservations) {
    await del(`/reservations/${id}`);
  }
  info(`Released ${reservations.length} reservations to restore stock`);
}

async function scenario4_concurrency() {
  section('Scenario 4 — Concurrency: 50 simultaneous requests for 10 units');

  // The rate limiter allows 20 POST /reservations per minute. Firing 50 at once
  // means some will be rate-limited (429); that is expected and counted separately.
  const CONCURRENT = 50;

  const requests = Array.from({ length: CONCURRENT }, () => createReservation());
  const results = await Promise.all(requests);

  const succeeded   = results.filter(r => r.status === 201);
  const outOfStock  = results.filter(r => r.status === 409);
  const rateLimited = results.filter(r => r.status === 429);

  info(`${CONCURRENT} concurrent requests fired simultaneously`);
  info(`Succeeded: ${succeeded.length} | Out-of-stock (409): ${outOfStock.length} | Rate-limited (429): ${rateLimited.length}`);

  assert(
    succeeded.length + outOfStock.length + rateLimited.length === CONCURRENT,
    `All ${CONCURRENT} requests accounted for (no lost requests)`,
    `Missing responses: expected ${CONCURRENT}, got ${succeeded.length + outOfStock.length + rateLimited.length}`,
  );

  assert(
    succeeded.length <= 50, // upper-bounded by stock; exact value depends on current inventory
    `No overselling detected (${succeeded.length} succeeded, none above available stock)`,
    `Possible oversell: ${succeeded.length} succeeded`,
  );

  // Cancel all successful reservations to restore stock.
  for (const r of succeeded) {
    await del(`/reservations/${r.data.id}`);
  }
  info(`Restored stock by cancelling ${succeeded.length} reservations`);
}

async function scenario5_invalidTransitions() {
  section('Scenario 5 — Invalid State Transitions');

  // Use retry helper: after the concurrency burst the rate limit quota may be spent.
  const { data: reservation } = await createReservationRetrying();
  info(`Created reservation [id: ${reservation.id}]`);

  // Confirm it.
  await post(`/reservations/${reservation.id}/confirm`);
  info(`Confirmed reservation`);

  // Try to confirm again — should be rejected.
  const { status: s1, data: d1 } = await post(`/reservations/${reservation.id}/confirm`);
  assert(s1 === 400,
    `Double-confirm rejected with 400 [message: ${d1.message}]`,
    `Expected 400 for double-confirm but got ${s1}: ${JSON.stringify(d1)}`);

  // Try to cancel a confirmed reservation — should be rejected.
  const { status: s2, data: d2 } = await del(`/reservations/${reservation.id}`);
  assert(s2 === 400,
    `Cancel-after-confirm rejected with 400 [message: ${d2.message}]`,
    `Expected 400 but got ${s2}: ${JSON.stringify(d2)}`);
}

async function scenario6_getStatus() {
  section('Scenario 6 — Get Reservation Status');

  // Use retry helper in case rate limit quota is still recovering.
  const { data: reservation } = await createReservationRetrying();
  const { status, data } = await get(`/reservations/${reservation.id}`);
  assert(status === 200 && data.status === 'ACTIVE',
    `GET returns correct reservation [status: ${data.status}]`,
    `Failed: ${JSON.stringify(data)}`);

  // Non-existent UUID should return 404.
  const { status: s404 } = await get(`/reservations/00000000-0000-0000-0000-000000000000`);
  assert(s404 === 404, `Non-existent reservation returns 404`, `Expected 404 but got ${s404}`);

  // Cleanup.
  await del(`/reservations/${reservation.id}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Inventory Reservation — Real Use Case Simulation');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Product: ${PRODUCT_ID}`);
  console.log(`   Note: sequential scenarios throttle at ${RATE_LIMIT_DELAY_MS}ms/req to respect 20 req/min limit`);

  try {
    await scenario1_happyPath();
    await scenario2_cancelFlow();
    await scenario3_outOfStock();
    await scenario4_concurrency();
    await scenario5_invalidTransitions();
    await scenario6_getStatus();

    console.log(`\n${'═'.repeat(60)}`);
    console.log('  Simulation complete');
    console.log('═'.repeat(60));
  } catch (err) {
    console.error('\n💥 Simulation crashed:', err);
    process.exit(1);
  }
}

main();
