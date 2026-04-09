import { CircuitBreakerService, CircuitState } from '../../../src/infrastructure/circuit-breaker/circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let cb: CircuitBreakerService;

  beforeEach(() => {
    cb = new CircuitBreakerService();
  });

  describe('initial state', () => {
    it('starts CLOSED', () => {
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('isOpen() returns false when CLOSED', () => {
      expect(cb.isOpen()).toBe(false);
    });
  });

  describe('recordFailure()', () => {
    it('opens the circuit after 5 consecutive failures', () => {
      for (let i = 0; i < 5; i++) {
        cb.recordFailure();
      }
      expect(cb.getState()).toBe(CircuitState.OPEN);
      expect(cb.isOpen()).toBe(true);
    });

    it('does not open before 5 failures', () => {
      for (let i = 0; i < 4; i++) {
        cb.recordFailure();
      }
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('reset()', () => {
    it('closes the circuit from OPEN', () => {
      for (let i = 0; i < 5; i++) cb.recordFailure();
      cb.reset();
      expect(cb.getState()).toBe(CircuitState.CLOSED);
      expect(cb.isOpen()).toBe(false);
    });
  });

  describe('recordSuccess() in HALF_OPEN', () => {
    it('closes the circuit after a successful probe', () => {
      // Force to HALF_OPEN by manipulating time
      const cbAny = cb as any;
      cbAny.state = CircuitState.HALF_OPEN;

      cb.recordSuccess();
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('recordFailure() in HALF_OPEN', () => {
    it('re-opens the circuit if the probe request fails', () => {
      const cbAny = cb as any;
      cbAny.state = CircuitState.HALF_OPEN;

      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitState.OPEN);
    });
  });
});
