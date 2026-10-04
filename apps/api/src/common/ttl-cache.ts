/** Process-local, bounded LRU cache. Failures are never cached; concurrent misses
 * share a loader. clear() also prevents an in-flight read restoring stale data. */
export class TtlCache<T> {
    private readonly entries = new Map<string, { value: T; expires: number }>();
    private readonly pending = new Map<string, Promise<T>>();
    private generation = 0;
    constructor(private readonly maxEntries: number) {}

    peek(key: string): T | undefined {
        const entry = this.entries.get(key);
        if (!entry) return undefined;
        this.entries.delete(key);
        if (entry.expires <= Date.now()) return undefined;
        this.entries.set(key, entry);
        return entry.value;
    }

    set(key: string, value: T, ttlMs: number) {
        this.entries.delete(key);
        this.entries.set(key, { value, expires: Date.now() + ttlMs });
        while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
    }

    clear() {
        this.generation++;
        this.entries.clear();
        this.pending.clear();
    }

    async getOrLoad(key: string, ttlMs: number, loader: () => Promise<T>, cacheable: (value: T) => boolean = () => true): Promise<T> {
        const cached = this.peek(key);
        if (cached !== undefined) return cached;
        const current = this.pending.get(key);
        if (current) return current;
        const generation = this.generation;
        const promise = Promise.resolve().then(loader).then(value => {
            if (generation === this.generation && cacheable(value)) this.set(key, value, ttlMs);
            return value;
        }).finally(() => {
            if (this.pending.get(key) === promise) this.pending.delete(key);
        });
        this.pending.set(key, promise);
        return promise;
    }
}
