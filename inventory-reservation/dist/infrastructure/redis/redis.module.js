"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = exports.REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const redis_stock_service_1 = require("./redis-stock.service");
const redis_constants_1 = require("./redis.constants");
var redis_constants_2 = require("./redis.constants");
Object.defineProperty(exports, "REDIS_CLIENT", { enumerable: true, get: function () { return redis_constants_2.REDIS_CLIENT; } });
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: redis_constants_1.REDIS_CLIENT,
                useFactory: () => {
                    return new ioredis_1.default({
                        host: process.env.REDIS_HOST ?? 'localhost',
                        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
                        lazyConnect: true,
                        enableOfflineQueue: false,
                        maxRetriesPerRequest: 1,
                    });
                },
            },
            redis_stock_service_1.RedisStockService,
        ],
        exports: [redis_constants_1.REDIS_CLIENT, redis_stock_service_1.RedisStockService],
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map