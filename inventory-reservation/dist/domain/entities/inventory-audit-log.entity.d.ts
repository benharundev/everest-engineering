export declare enum InventoryAuditAction {
    RESERVED = "RESERVED",
    RELEASED = "RELEASED",
    CONFIRMED = "CONFIRMED",
    REHYDRATED = "REHYDRATED"
}
export declare class InventoryAuditLog {
    id: string;
    productId: string;
    action: InventoryAuditAction;
    quantityDelta: number;
    stockBefore: number;
    stockAfter: number;
    reservationId: string | null;
    createdAt: Date;
}
