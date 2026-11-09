// Coalesce only identical in-flight creates inside one process. Every HTTP call
// still passes auth/rate limits; Firestore receipts remain the cross-instance authority.
export class IncidentCreateConflict extends Error {}
export class IncidentCreateBusy extends Error {}
export class IncidentCreateFlight {
  private readonly active = new Map<string, { fingerprint: string; promise: Promise<unknown> }>();
  constructor(private readonly maxKeys = 256) {}
  async run<T>(key: string, fingerprint: string, work: () => Promise<T>): Promise<T> {
    const previous = this.active.get(key);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new IncidentCreateConflict('Request ID already used');
      return previous.promise as Promise<T>;
    }
    if (this.active.size >= this.maxKeys) throw new IncidentCreateBusy('Create capacity busy');
    const entry = { fingerprint, promise: Promise.resolve().then(work) };
    this.active.set(key, entry);
    try { return await entry.promise; }
    finally { if (this.active.get(key) === entry) this.active.delete(key); }
  }
}
