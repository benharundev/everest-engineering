"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutexService = void 0;
const common_1 = require("@nestjs/common");
const async_mutex_1 = require("async-mutex");
let MutexService = class MutexService {
    constructor() {
        this.mutexes = new Map();
    }
    async runExclusive(key, fn) {
        const mutex = this.getOrCreate(key);
        return mutex.runExclusive(fn);
    }
    getOrCreate(key) {
        if (!this.mutexes.has(key)) {
            this.mutexes.set(key, new async_mutex_1.Mutex());
        }
        return this.mutexes.get(key);
    }
};
exports.MutexService = MutexService;
exports.MutexService = MutexService = __decorate([
    (0, common_1.Injectable)()
], MutexService);
//# sourceMappingURL=mutex.service.js.map