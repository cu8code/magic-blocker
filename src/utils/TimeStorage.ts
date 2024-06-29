class TimedStorage {
    private storage: { [key: string]: any } = {};
    private timeouts: { [key: string]: ReturnType<typeof setTimeout> } = {};

    set(key: string, value: any, duration: number): void {
        this.storage[key] = value;

        // Clear any existing timeout for this key
        if (this.timeouts[key]) {
            clearTimeout(this.timeouts[key]);
        }

        // Set a new timeout
        this.timeouts[key] = setTimeout(() => {
            this.flush(key);
        }, duration);
    }

    get(key: string): any {
        return this.storage[key];
    }

    flush(key: string): void {
        delete this.storage[key];
        delete this.timeouts[key];
    }

    flushAll(): void {
        for (const key in this.timeouts) {
            clearTimeout(this.timeouts[key]);
        }
        this.storage = {};
        this.timeouts = {};
    }
}

export default TimedStorage