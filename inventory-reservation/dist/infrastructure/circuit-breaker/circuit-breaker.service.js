"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CircuitBreakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerService = exports.CircuitState = void 0;
const common_1 = require("@nestjs/common");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT_MS = 30_000;
let CircuitBreakerService = CircuitBreakerService_1 = class CircuitBreakerService {
    constructor() {
        this.logger = new common_1.Logger(CircuitBreakerService_1.name);
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.nextAttemptAt = null;
    }
    isOpen() {
        if (this.state === CircuitState.CLOSED) {
            return false;
        }
        if (this.state === CircuitState.OPEN) {
            if (this.nextAttemptAt && Date.now() >= this.nextAttemptAt.getTime()) {
                this.transitionTo(CircuitState.HALF_OPEN);
                return false;
            }
            return true;
        }
        return false;
    }
    recordFailure() {
        this.failureCount++;
        if (this.state === CircuitState.HALF_OPEN ||
            this.failureCount >= FAILURE_THRESHOLD) {
            this.transitionTo(CircuitState.OPEN);
        }
    }
    recordSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.reset();
        }
    }
    reset() {
        this.failureCount = 0;
        this.nextAttemptAt = null;
        this.transitionTo(CircuitState.CLOSED);
    }
    getState() {
        return this.state;
    }
    transitionTo(next) {
        if (this.state !== next) {
            this.logger.warn(`Circuit breaker: ${this.state} → ${next}`);
            this.state = next;
            if (next === CircuitState.OPEN) {
                this.failureCount = 0;
                this.nextAttemptAt = new Date(Date.now() + RECOVERY_TIMEOUT_MS);
            }
        }
    }
};
exports.CircuitBreakerService = CircuitBreakerService;
exports.CircuitBreakerService = CircuitBreakerService = CircuitBreakerService_1 = __decorate([
    (0, common_1.Injectable)()
], CircuitBreakerService);
//# sourceMappingURL=circuit-breaker.service.js.map