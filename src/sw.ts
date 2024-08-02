interface Entry {
  id: string;
  filename: string;
}

interface WriteOperation {
  content: string;
  id: string;
  operation: "write";
}

interface ReadOperation {
  id: string;
  operation: "read";
}

interface OpenOperation {
  operation: "open";
  suggestedName: string;
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
    const filename = event.data.suggestedName;
    const fileHandle = await root.getFileHandle(filename, { create: true });
    const id = await saveFilename(filename);
    const syncHandle = await fileHandle.createSyncAccessHandle();
    const buffer = new ArrayBuffer(syncHandle.getSize());
    syncHandle.read(buffer, { at: 0 });
    syncHandle.close();
    const decoder = new TextDecoder();
    const content = decoder.decode(buffer);
    self.postMessage({
      operation: "open",
      success: true,
      id,
      content,
      filename: fileHandle.name,
    });
  }

  if (operation === "read") {
    const id = event.data.id;
    const filename = await getFilename(id);
    if (!filename) {
      console.log("File not found.");
      self.postMessage({ operation: "read", success: false });
      return;
    }
    const fileHandle = await root.getFileHandle(filename);
    const syncHandle = await fileHandle.createSyncAccessHandle();
    const buffer = new ArrayBuffer(syncHandle.getSize());
    syncHandle.read(buffer, { at: 0 });
    syncHandle.close();
    const decoder = new TextDecoder();
    const content = decoder.decode(buffer);
    self.postMessage({
      operation: "read",
      success: true,
      filename: fileHandle.name,
      content,
    });
  }

  if (operation === "write") {
    const id = event.data.id;
    const content = event.data.content;
    const filename = await getFilename(id);
    if (!filename) {
      console.log("File not found.");
      self.postMessage({ operation: "write", success: false });
      return;
    }
    const fileHandle = await root.getFileHandle(filename);
    const syncHandle = await fileHandle.createSyncAccessHandle();
    try {
      const encoder = new TextEncoder();
      const writeBuffer = encoder.encode(content);
      syncHandle.write(writeBuffer, { at: 0 });
    } catch (err) {
      debugger;
      console.error(err);
      throw err;
    }
    syncHandle.close();
    self.postMessage({
      operation: "write",
      success: true,
      filename: fileHandle.name,
    });
  }

  if (operation === "delete") {
    const id = event.data.id;
    const filename = await getFilename(id);
    if (!filename) {
      console.log("File not found.");
      self.postMessage({ operation: "delete", success: false });
      return;
    }
    await root.removeEntry(filename);
    await removeFilename(id);
    self.postMessage({ operation: "delete", success: true });
  }
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("filenameDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore("filenames", { keyPath: "id" });
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

async function saveFilename(filename: string): Promise<string> {
  const db = await openDatabase();
  const id = generateId();
  return new Promise<string>((resolve, reject) => {
    const transaction = db.transaction(["filenames"], "readwrite");
    const store = transaction.objectStore("filenames");
    const request = store.put({
      id,
      filename,
    } as Entry);
    request.onsuccess = () => {
      resolve(id);
    };
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  });
}

async function getFilename(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(["filenames"], "readonly");
  const store = transaction.objectStore("filenames");
  const request = store.get(id);
  return getFilenameFromRequest<Entry>(request).then((e) => e?.filename);
}

async function removeFilename(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(["filenames"], "readonly");
  const store = transaction.objectStore("filenames");
  const request = store.delete(id);
  return getFilenameFromRequest<Entry>(request);
}

function getFilenameFromRequest<T>(
  request: IDBRequest,
): Promise<T | undefined> {
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
