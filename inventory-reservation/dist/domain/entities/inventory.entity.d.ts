export declare class Inventory {
    productId: string;
    name: string;
    totalStock: number;
    confirmedSales: number;
    activeReservations: number;
    updatedAt: Date;
    version: number;
    get availableStock(): number;
    incrementActiveReservations(quantity: number): void;
    decrementActiveReservations(quantity: number): void;
    confirmSale(quantity: number): void;
}
