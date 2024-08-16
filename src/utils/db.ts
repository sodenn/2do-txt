export interface DbEntry {
  id: string;
}

const DB_NAME = "todo-web-db";

export class Db<T extends DbEntry> {
  private readonly storageName;
  private storageCreated = false;

  constructor(name: string) {
    this.storageName = name + "-store";
  }

  async read(id: string) {
    const store = await this.getStore("readonly");
    const request = store.get(id);
    return this.promiseForRequest<T>(request);
  }

  async create(item: Omit<T, "id">) {
    const id = this.generateId();
    const store = await this.getStore();
    const request = store.put({ id, ...item });
    return this.promiseForRequest<string>(request);
  }

  async update(item: Partial<T> & DbEntry) {
    const currentValue = await this.read(item.id);
    const store = await this.getStore();
    const newValue = { ...currentValue, ...item };
    const request = store.put({ ...currentValue, ...item });
    await this.promiseForRequest<string>(request);
    return newValue;
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

  private async openDatabase(): Promise<IDBDatabase> {
    await this.addObjectStore();
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
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

  addObjectStore() {
    if (this.storageCreated) {
      return;
    }
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => {
        const db = request.result;
        const currentVersion = db.version;
        const containsStorage = db.objectStoreNames.contains(this.storageName);
        db.close();
        if (containsStorage) {
          resolve();
          return;
        }

        const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1);

        upgradeRequest.onupgradeneeded = () => {
          const db = upgradeRequest.result;
          const objectStore = db.createObjectStore(this.storageName, {
            keyPath: "id",
          });
          objectStore.createIndex("id", "id", { unique: true });
          console.log(
            `Object store '${this.storageName}' created successfully`,
          );
        };

        upgradeRequest.onsuccess = () => {
          console.log("Database upgraded successfully");
          upgradeRequest.result.close();
          this.storageCreated = true;
          resolve();
        };

        upgradeRequest.onerror = () => {
          console.error("Error upgrading database:", upgradeRequest.error);
          reject(upgradeRequest.error);
        };
      };

      request.onerror = () => {
        console.error("Error opening database:", request.error);
        reject(request.error);
      };
    });
  }
}
