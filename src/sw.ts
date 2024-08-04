interface Entry {
  id: string;
  filename: string;
}

interface OpenOptions {
  operation: "open";
  operationId: string;
  suggestedName: string;
}

interface OpenResult {
  operation: "open";
  operationId: string;
  success: true;
  id: string;
  content: string;
  filename: string;
}

interface ReadOptions {
  id: string;
  operation: "read";
  operationId: string;
}

interface ReadResult {
  operation: "read";
  operationId: string;
  success: true;
  content: string;
  filename: string;
}

interface WriteOptions {
  operation: "write";
  operationId: string;
  content: string;
  id: string;
}

interface WriteResult {
  operation: "write";
  operationId: string;
  success: true;
  filename: string;
}

interface DeleteOptions {
  operation: "delete";
  operationId: string;
  id: string;
}

interface DeleteResult {
  operation: "delete";
  operationId: string;
  success: true;
}

interface DeleteNotInListOptions {
  operation: "delete-not-in-list";
  operationId: string;
  ids: string[];
}

interface DeleteNotInListResult {
  operation: "delete-not-in-list";
  operationId: string;
  success: true;
}

interface GetNextFreeFilenameOptions {
  operation: "get-next-free-filename";
  operationId: string;
  filename: string;
}

interface GetNextFreeFilenameResult {
  operation: "get-next-free-filename";
  operationId: string;
  success: true;
  filename: string;
}

type Options =
  | OpenOptions
  | WriteOptions
  | ReadOptions
  | DeleteOptions
  | DeleteNotInListOptions
  | GetNextFreeFilenameOptions;

self.onmessage = async (event: MessageEvent<Options>) => {
  const operation = event.data.operation;
  const operationId = event.data.operationId;
  const root = await navigator.storage.getDirectory();

  try {
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
        operationId,
        success: true,
        id,
        content,
        filename: fileHandle.name,
      } as OpenResult);
    }

    if (operation === "read") {
      const id = event.data.id;
      const filename = await getFilename(id);
      const fileHandle = await root.getFileHandle(filename);
      const syncHandle = await fileHandle.createSyncAccessHandle();
      const buffer = new ArrayBuffer(syncHandle.getSize());
      syncHandle.read(buffer, { at: 0 });
      syncHandle.close();
      const decoder = new TextDecoder();
      const content = decoder.decode(buffer);
      self.postMessage({
        operation: "read",
        operationId,
        success: true,
        filename: fileHandle.name,
        content,
      } as ReadResult);
    }

    if (operation === "write") {
      const id = event.data.id;
      const content = event.data.content;
      const filename = await getFilename(id);
      const fileHandle = await root.getFileHandle(filename);
      const syncHandle = await fileHandle.createSyncAccessHandle();
      const encoder = new TextEncoder();
      const writeBuffer = encoder.encode(content);
      syncHandle.write(writeBuffer, { at: 0 });
      syncHandle.close();
      self.postMessage({
        operation: "write",
        operationId,
        success: true,
        filename: fileHandle.name,
      } as WriteResult);
    }

    if (operation === "delete") {
      const id = event.data.id;
      const filename = await getFilename(id);
      await root.removeEntry(filename);
      await removeFilename(id);
      self.postMessage({
        operation: "delete",
        operationId,
        success: true,
      } as DeleteResult);
    }

    if (operation === "delete-not-in-list") {
      const ids = event.data.ids;
      await removeFilenamesNotInList(ids);
      self.postMessage({
        operation: "delete-not-in-list",
        operationId,
        success: true,
      } as DeleteNotInListResult);
    }

    if (operation === "get-next-free-filename") {
      const filename = await getNextFreeFileName(event.data.filename);
      self.postMessage({
        operation: "get-next-free-filename",
        operationId,
        success: true,
        filename,
      } as GetNextFreeFilenameResult);
    }
  } catch (error) {
    console.error(`${operation} failed: ${error}`);
    self.postMessage({
      operation,
      operationId,
      success: false,
    });
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
  const filename = await getFilenameFromRequest<Entry>(request).then(
    (e) => e?.filename,
  );
  if (!filename) {
    throw new Error("Cannot find filename by ID");
  }
  return filename;
}

async function removeFilename(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(["filenames"], "readwrite");
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
