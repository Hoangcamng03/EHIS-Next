// Serialize only a shared budget transaction inside this process. Firestore remains
// the cross-instance authority; no quota is cached, skipped, or reserved locally.
export class BudgetQueueBusy extends Error {
  constructor() { super('Request budget queue is busy'); }
}

type Slot = { tail: Promise<void>; pending: number };

export class BudgetQueue {
  private readonly slots = new Map<string, Slot>();
  constructor(private readonly maxKeys = 256, private readonly maxPending = 64, private readonly maxWaitMs = 2000) {}

  async run<T>(key: string, work: () => Promise<T>): Promise<T> {
    let slot = this.slots.get(key);
    if (!slot) {
      if (this.slots.size >= this.maxKeys) throw new BudgetQueueBusy();
      slot = { tail: Promise.resolve(), pending: 0 };
      this.slots.set(key, slot);
    }
    if (slot.pending >= this.maxPending) throw new BudgetQueueBusy();
    slot.pending++;
    const previous = slot.tail;
    let complete!: () => void;
    slot.tail = new Promise<void>(resolve => { complete = resolve; });
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      slot.pending--;
      complete();
      if (slot.pending === 0 && this.slots.get(key) === slot) this.slots.delete(key);
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const acquired = await Promise.race([
      previous.then(() => true),
      new Promise<false>(resolve => { timer = setTimeout(() => resolve(false), this.maxWaitMs); }),
    ]).finally(() => { if (timer) clearTimeout(timer); });
    if (!acquired) {
      // A timed-out waiter must not let its successor overlap the active work.
      void previous.then(release);
      throw new BudgetQueueBusy();
    }
    try { return await work(); } finally { release(); }
  }
}
