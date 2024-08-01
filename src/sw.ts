interface FileHandleEntry {
  id: string;
  handle: FileSystemFileHandle;
}

interface WriteOperation {
  content: Uint8Array;
  id: string;
  operation: "write";
}

interface ReadOperation {
  id: string;
  operation: "read";
}

interface OpenOperation {
  operation: "open";
}

interface DeleteOperation {
  id: string;
  operation: "delete";
}

type Operation =
  | OpenOperation
  | WriteOperation
  | ReadOperation
  | DeleteOperation;

self.onmessage = async (event: MessageEvent<Operation>) => {
  const operation = event.data.operation;
  const root = await navigator.storage.getDirectory();

  if (operation === "open") {
    const fileHandle = await root.getFileHandle("todo.txt", { create: true });
    const syncHandle = await fileHandle.createSyncAccessHandle();
    const id = await storeFileHandle(fileHandle);
    const buffer = new ArrayBuffer(syncHandle.getSize());
    syncHandle.read(buffer, { at: 0 });
    syncHandle.close();
    self.postMessage({
      operation: "read",
      success: true,
      id,
      content: buffer,
      filename: fileHandle.name,
    });
  }

  if (operation === "read") {
    const id = event.data.id;
    const fileHandle = await getFileHandleById(id);
    if (!fileHandle) {
      console.log("Missing fileHandle");
      self.postMessage({ operation: "read", success: false });
      return;
    }
    const syncHandle = await fileHandle.createSyncAccessHandle();
    const buffer = new ArrayBuffer(syncHandle.getSize());
    syncHandle.read(buffer, { at: 0 });
    syncHandle.close();
    self.postMessage({
      operation: "read",
      success: true,
      filename: fileHandle.name,
      content: buffer,
    });
  }

  if (operation === "write") {
    const id = event.data.id;
    const content = event.data.content;
    const fileHandle = await getFileHandleById(id);
    if (!fileHandle) {
      console.log("Missing fileHandle");
      self.postMessage({ operation: "write", success: false });
      return;
    }
    const syncHandle = await fileHandle.createSyncAccessHandle();
    syncHandle.write(content, { at: 0 });
    syncHandle.close();
    self.postMessage({
      operation: "write",
      success: true,
      filename: fileHandle.name,
    });
  }

  if (operation === "delete") {
    const id = event.data.id;
    const fileHandle = await getFileHandleById(id);
    if (!fileHandle) {
      console.log("Missing fileHandle");
      self.postMessage({ operation: "delete", success: false });
      return;
    }
    await root.removeEntry(fileHandle.name);
    self.postMessage({ operation: "delete", success: true });
  }
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("fileHandlesDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore("fileHandles", { keyPath: "id" });
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

async function storeFileHandle(
  fileHandle: FileSystemFileHandle,
): Promise<string> {
  const db = await openDatabase();
  const id = generateId();
  return new Promise<string>((resolve, reject) => {
    const transaction = db.transaction(["fileHandles"], "readwrite");
    const store = transaction.objectStore("fileHandles");
    debugger;
    const request = store.put({
      id,
      handle: fileHandle,
    } as FileHandleEntry);
    debugger;
    request.onsuccess = () => {
      resolve(id);
    };
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  });
}

async function getFileHandleById(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(["fileHandles"], "readonly");
  const store = transaction.objectStore("fileHandles");
  const request = store.get(id);
  return getFileHandle<FileHandleEntry>(request).then((e) => e?.handle);
}

function getFileHandle<T>(request: IDBRequest): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result as T | undefined;
      if (result) {
        resolve(result);
      } else {
        resolve(undefined);
      }
    };
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  });
}

function generateId() {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substring(2, 10);
}
