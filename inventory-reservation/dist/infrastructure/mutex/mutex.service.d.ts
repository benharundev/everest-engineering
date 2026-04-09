export declare class MutexService {
    private readonly mutexes;
    runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T>;
    private getOrCreate;
}
