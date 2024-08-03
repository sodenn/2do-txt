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

export interface DeleteNotInListOptions {
  ids: string[];
  operation: "delete-not-in-list";
}

interface DeleteNotInListResultSuccess {
  operation: "delete-not-in-list";
  success: true;
}

interface DeleteNotInListResultError {
  operation: "delete-not-in-list";
  success: false;
}

export type DeleteNotInListResult =
  | DeleteNotInListResultSuccess
  | DeleteNotInListResultError;

export type Options =
  | OpenOptions
  | WriteOptions
  | ReadOptions
  | DeleteOptions
  | DeleteNotInListOptions;

self.onmessage = async (event: MessageEvent<Options>) => {
  const operation = event.data.operation;
  const root = await navigator.storage.getDirectory();

  if (operation === "open") {
    const suggestedName = event.data.suggestedName;
    const filename = await getNextFreeFileName(suggestedName);
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

  if (operation === "delete-not-in-list") {
    const ids = event.data.ids;
    await removeFilenamesNotInList(ids);
    self.postMessage({
      operation: "delete-not-in-list",
      success: true,
    } as DeleteNotInListResultSuccess);
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

async function removeFilenamesNotInList(ids: string[]) {
  const db = await openDatabase();
  const transaction = db.transaction(["filenames"], "readonly");
  const store = transaction.objectStore("filenames");
  const request = store.openCursor();
  const idsNotInList = await new Promise<string[]>((resolve, reject) => {
    const result: string[] = [];
    request.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const document = cursor.value as { id: string };
        if (!ids.includes(document.id)) {
          result.push(document.id);
        }
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    request.onerror = (event: Event) => {
      reject((event.target as IDBRequest).error);
    };
  });
  await Promise.all(idsNotInList.map(removeFilename));
}

async function getNextFreeFileName(desiredFileName: string): Promise<string> {
  const parts = desiredFileName.split(".");
  const baseName = parts.slice(0, -1).join(".");
  const extension = parts.length > 1 ? "." + parts[parts.length - 1] : "";

  const db = await openDatabase();
  const transaction = db.transaction(["filenames"], "readonly");
  const store = transaction.objectStore("filenames");

  // Get all filenames from the database
  const filenames: string[] = [];
  return new Promise<string>((resolve, reject) => {
    store.openCursor().onsuccess = function (event) {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
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

    transaction.onerror = function (event) {
      console.error("Transaction failed", event);
      reject();
    };
  });
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
