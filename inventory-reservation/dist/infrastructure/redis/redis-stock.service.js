"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RedisStockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStockService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const redis_constants_1 = require("./redis.constants");
const ATOMIC_DECREMENT_SCRIPT = `
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock == nil then return -1 end
if stock >= tonumber(ARGV[1]) then
  redis.call('DECRBY', KEYS[1], ARGV[1])
  return 1
end
return 0
`;
let RedisStockService = RedisStockService_1 = class RedisStockService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(RedisStockService_1.name);
    }
    async atomicDecrement(productId, quantity) {
        const key = this.stockKey(productId);
        const result = await this.redis.eval(ATOMIC_DECREMENT_SCRIPT, 1, key, quantity.toString());
        if (result === -1) {
            return false;
        }
        return result === 1;
    }
    async increment(productId, quantity) {
        await this.redis.incrby(this.stockKey(productId), quantity);
    }
    async setStock(productId, availableStock) {
        await this.redis.set(this.stockKey(productId), availableStock);
    }
    async getStock(productId) {
        const value = await this.redis.get(this.stockKey(productId));
        return value === null ? null : parseInt(value, 10);
    }
    async ping() {
        try {
            const response = await this.redis.ping();
            return response === 'PONG';
        }
        catch {
            return false;
        }
    }
    stockKey(productId) {
        return `stock:${productId}`;
    }
};
exports.RedisStockService = RedisStockService;
exports.RedisStockService = RedisStockService = RedisStockService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_constants_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default])
], RedisStockService);
//# sourceMappingURL=redis-stock.service.js.map