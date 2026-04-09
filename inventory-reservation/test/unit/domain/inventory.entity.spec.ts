import { Inventory } from '../../../src/domain/entities/inventory.entity';

describe('Inventory Entity', () => {
  function makeInventory(
    totalStock: number,
    confirmedSales = 0,
    activeReservations = 0,
  ): Inventory {
    const inv = new Inventory();
    inv.productId = '11111111-1111-1111-1111-111111111111';
    inv.totalStock = totalStock;
    inv.confirmedSales = confirmedSales;
    inv.activeReservations = activeReservations;
    return inv;
  }

  // ── Available Stock Formula ────────────────────────────────────────────────

  describe('availableStock', () => {
    it('equals totalStock when nothing is reserved or sold', () => {
      expect(makeInventory(100).availableStock).toBe(100);
    });

    it('subtracts confirmedSales from totalStock', () => {
      expect(makeInventory(100, 30).availableStock).toBe(70);
    });

    it('subtracts activeReservations from totalStock', () => {
      expect(makeInventory(100, 0, 20).availableStock).toBe(80);
    });

    it('subtracts both confirmedSales and activeReservations', () => {
      // The core business rule: Available = Total - Confirmed - Active
      expect(makeInventory(100, 30, 20).availableStock).toBe(50);
    });

    it('returns 0 when all stock is accounted for', () => {
      expect(makeInventory(10, 6, 4).availableStock).toBe(0);
    });
  });

  // ── incrementActiveReservations ────────────────────────────────────────────

  describe('incrementActiveReservations()', () => {
    it('increases activeReservations by the given quantity', () => {
      const inv = makeInventory(10, 0, 0);
      inv.incrementActiveReservations(3);
      expect(inv.activeReservations).toBe(3);
      expect(inv.availableStock).toBe(7);
    });
  });

  // ── decrementActiveReservations ────────────────────────────────────────────

  describe('decrementActiveReservations()', () => {
    it('decreases activeReservations by the given quantity', () => {
      const inv = makeInventory(10, 0, 5);
      inv.decrementActiveReservations(3);
      expect(inv.activeReservations).toBe(2);
    });

    it('floors at 0 — never goes negative', () => {
      const inv = makeInventory(10, 0, 2);
      inv.decrementActiveReservations(5);
      expect(inv.activeReservations).toBe(0);
    });
  });

  // ── confirmSale ────────────────────────────────────────────────────────────

  describe('confirmSale()', () => {
    it('moves quantity from activeReservations to confirmedSales', () => {
      const inv = makeInventory(10, 0, 5);
      inv.confirmSale(3);
      expect(inv.activeReservations).toBe(2);
      expect(inv.confirmedSales).toBe(3);
      expect(inv.availableStock).toBe(5);
    });
  });
});
