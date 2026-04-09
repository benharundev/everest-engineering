"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutOfStockException = void 0;
const common_1 = require("@nestjs/common");
class OutOfStockException extends common_1.ConflictException {
    constructor(productId, requested, available) {
        super(`Insufficient stock for product '${productId}': requested ${requested}, available ${available}`);
    }
}
exports.OutOfStockException = OutOfStockException;
//# sourceMappingURL=out-of-stock.exception.js.map