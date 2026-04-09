export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export declare class CircuitBreakerService {
    private readonly logger;
    private state;
    private failureCount;
    private nextAttemptAt;
    isOpen(): boolean;
    recordFailure(): void;
    recordSuccess(): void;
    reset(): void;
    getState(): CircuitState;
    private transitionTo;
}
