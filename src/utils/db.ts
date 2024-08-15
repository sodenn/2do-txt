export class Db<T extends { id: string }> {
  private readonly storageName;

  constructor(name: string) {
    this.storageName = name + "-store";
  }

  async read(id: string) {
    const store = await this.getStore("readonly");
    const request = store.get(id);
    return this.promiseForRequest<T>(request);
  }

  async write(item: Omit<T, "id">) {
    const id = this.generateId();
    const store = await this.getStore();
    const request = store.put({ id, ...item });
    return this.promiseForRequest<string>(request);
  }

  async delete(id: string) {
    const store = await this.getStore();
    const request = store.delete(id);
    return this.promiseForRequest(request);
  }

  async deleteNotInList(ids: string[]) {
    const store = await this.getStore();
    await new Promise<void>((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const { id } = cursor.value as { id: string };
          if (!ids.includes(id)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("todo-web-db", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        const objectStore = db.createObjectStore(this.storageName, {
          keyPath: "id",
        });
        objectStore.createIndex("id", "id", { unique: true });
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  protected async getStore(mode: IDBTransactionMode = "readwrite") {
    const db = await this.openDatabase();
    const transaction = db.transaction([this.storageName], mode);
    return transaction.objectStore(this.storageName);
  }

  private promiseForRequest<T = void>(request: IDBRequest) {
    return new Promise<T>((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private generateId() {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "")
      .substring(2, 10);
  }
}
