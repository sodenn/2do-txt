interface DbEntry {
  id: number;
}

interface FileHandle extends DbEntry {
  handle: FileSystemFileHandle;
}

interface FileIds extends DbEntry {
  items: {
    todoFileId: number;
    doneFileId?: number;
  }[];
}

interface File extends DbEntry {
  filename: string;
  content?: string;
}

interface DBSchema {
  fileHandles: FileHandle;
  fileIds: FileIds;
  files: File;
}

type Kebab<
  T extends string,
  A extends string = "",
> = T extends `${infer F}${infer R}`
  ? Kebab<R, `${A}${F extends Lowercase<F> ? "" : "-"}${Lowercase<F>}`>
  : A;

type Store<K> = K extends string ? `${K}-store` : K;

type StoresName = Kebab<Store<keyof DBSchema>>;

const stores: StoresName[] = [
  "file-handles-store",
  "file-ids-store",
  "files-store",
];

const DB_NAME = "todo-db";

class Db {
  get fileHandles() {
    return this.getEntity<FileHandle>("file-handles-store");
  }

  get fileIds() {
    return this.getEntity<FileIds>("file-ids-store");
  }

  get files() {
    const methods = this.getEntity<File>("files-store");
    return {
      ...methods,
      getNextFreeFilename: (desiredFileName: string) => {
        return this.getNextFreeFilename(desiredFileName);
      },
    };
  }

  protected getEntity<T>(storageName: StoresName) {
    return {
      read: (id: number) => {
        return this.read<T>(storageName, id);
      },
      list: () => {
        return this.list<T>(storageName);
      },
      create: (item: Omit<T, "id">) => {
        return this.create<T>(storageName, item);
      },
      update: (item: Partial<T> & DbEntry) => {
        return this.update<T>(storageName, item);
      },
      delete: (id: number) => {
        return this.delete(storageName, id);
      },
      deleteNotInList: (ids: number[]) => {
        return this.deleteNotInList(storageName, ids);
      },
    };
  }

  protected async read<T>(storageName: StoresName, id: number) {
    const store = await this.getStore(storageName, "readonly");
    const request = store.get(id);
    return this.promiseForRequest<T>(request);
  }

  protected async list<T>(storageName: StoresName) {
    const store = await this.getStore(storageName, "readonly");
    const request = store.getAll();
    const result = await this.promiseForRequest<T[]>(request);
    return result || [];
  }

  protected async create<T>(storageName: StoresName, item: Omit<T, "id">) {
    const store = await this.getStore(storageName);
    const request = store.add(item);
    const id = await this.promiseForRequest<number>(request);
    return { id, ...item };
  }

  protected async update<T>(
    storageName: StoresName,
    item: Partial<T> & DbEntry,
  ) {
    const currentItem = await this.read<T>(storageName, item.id);
    const store = await this.getStore(storageName);
    const newValue = { ...currentItem, ...item };
    const request = store.put(newValue);
    await this.promiseForRequest<number>(request);
    return newValue;
  }

  protected async delete(storageName: StoresName, id: number) {
    const store = await this.getStore(storageName);
    const request = store.delete(id);
    await this.promiseForRequest(request);
  }

  protected async deleteNotInList(storageName: StoresName, ids: number[]) {
    const store = await this.getStore(storageName);
    await new Promise<void>((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const { id } = cursor.value as { id: number };
          if (!ids.includes(id)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => {
        reject(request.error as Error);
      };
    });
  }

  protected async getNextFreeFilename(
    desiredFileName: string,
  ): Promise<string> {
    const parts = desiredFileName.split(".");
    const baseName = parts.slice(0, -1).join(".");
    const extension = parts.length > 1 ? "." + parts[parts.length - 1] : "";
    const store = await this.getStore("files-store");

    // Get all filenames from the database
    const filenames: string[] = [];

    return new Promise<string>((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          filenames.push(cursor.value.filename);
          cursor.continue();
        } else {
          // Check if the original filename exists
          if (!filenames.includes(desiredFileName)) {
            resolve(desiredFileName);
            return;
          }
          // Generate a new filename with a counter
          let counter = 1;
          let newFilename;
          do {
            newFilename = `${baseName}(${counter})${extension}`;
            counter++;
          } while (filenames.includes(newFilename));
          // Return the new filename
          resolve(newFilename);
        }
      };
      request.onerror = () => {
        reject(request.error as Error);
      };
    });
  }

  protected async getStore(
    storageName: StoresName,
    mode: IDBTransactionMode = "readwrite",
  ) {
    const db = await this.openDatabase();
    const transaction = db.transaction([storageName], mode);
    return transaction.objectStore(storageName);
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of stores) {
          db.createObjectStore(store, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error as Error);
      };
    });
  }

  private promiseForRequest<T = void>(request: IDBRequest) {
    return new Promise<T>((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error as Error);
      };
    });
  }
}

export const db = new Db();
