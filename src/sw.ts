export interface Entry {
  id: string;
  filename: string;
}

export interface OpenOptions {
  operation: "open";
  suggestedName: string;
}

export interface OpenResult {
  operation: "open";
  success: true;
  id: string;
  content: string;
  filename: string;
}

export interface ReadOptions {
  id: string;
  operation: "read";
}

interface ReadResultSuccess {
  operation: "read";
  success: true;
  content: string;
  filename: string;
}

interface ReadResultError {
  operation: "read";
  success: false;
}

export type ReadResult = ReadResultSuccess | ReadResultError;

export interface WriteOptions {
  content: string;
  id: string;
  operation: "write";
}

interface WriteResultSuccess {
  operation: "write";
  success: true;
  filename: string;
}

interface WriteResultError {
  operation: "write";
  success: false;
}

export type WriteResult = WriteResultSuccess | WriteResultError;

export interface DeleteOptions {
  id: string;
  operation: "delete";
}

interface DeleteResultSuccess {
  operation: "delete";
  success: true;
}

interface DeleteResultError {
  operation: "delete";
  success: false;
}

export type DeleteResult = DeleteResultSuccess | DeleteResultError;

export type Options = OpenOptions | WriteOptions | ReadOptions | DeleteOptions;

self.onmessage = async (event: MessageEvent<Options>) => {
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
    } as OpenResult);
  }

  if (operation === "read") {
    const id = event.data.id;
    const filename = await getFilename(id);
    if (!filename) {
      console.log("File not found.");
      self.postMessage({
        operation: "read",
        success: false,
      } as ReadResultError);
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
    } as ReadResultSuccess);
  }

  if (operation === "write") {
    const id = event.data.id;
    const content = event.data.content;
    const filename = await getFilename(id);
    if (!filename) {
      console.log("File not found.");
      self.postMessage({
        operation: "write",
        success: false,
      } as WriteResultError);
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
    } as WriteResultSuccess);
  }

  if (operation === "delete") {
    const id = event.data.id;
    const filename = await getFilename(id);
    if (!filename) {
      console.log("File not found.");
      self.postMessage({
        operation: "delete",
        success: false,
      } as DeleteResultError);
      return;
    }
    await root.removeEntry(filename);
    await removeFilename(id);
    self.postMessage({
      operation: "delete",
      success: true,
    } as DeleteResultSuccess);
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
