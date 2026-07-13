// TODO: implement IndexedDB offline persistence logic in Phase 3

export class OfflineStorage {
  async saveEntry(entry: unknown): Promise<void> {
    console.log('IndexedDB placeholder: saving entry offline', entry);
  }

  async getPendingEntries(): Promise<unknown[]> {
    return [];
  }
}
