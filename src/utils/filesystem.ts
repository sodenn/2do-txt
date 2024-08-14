import { SUPPORTS_SHOW_OPEN_FILE_PICKER } from "@/utils/platform";
import { generateId } from "@/utils/uuid";
import * as fallbackFilesystem from "./fallback-filesystem";

interface FileHandleEntry {
  id: string;
  handle: FileSystemFileHandle;
}

type FileErrorReason =
  | "PICKER_CLOSED"
  | "RETRIEVAL_FAILED"
  | "PERMISSION_DENIED"
  | "UNKNOWN";

export class FileError extends Error {
  reason: FileErrorReason;
  filename?: string;
  private static reasonMessages: Record<FileErrorReason, string> = {
    PICKER_CLOSED: "File picker was closed without selecting a file",
    RETRIEVAL_FAILED: "Failed to retrieve file handle from database",
    PERMISSION_DENIED: "File access denied.",
    UNKNOWN: "Unable to access the file due to an unknown problem",
  };
  constructor(reason: FileErrorReason, filename?: string) {
    const message =
      FileError.reasonMessages[reason] || "An unknown file error occurred";
    super(message);
    this.name = "FileError";
    this.reason = reason;
    this.filename = filename;
    Object.setPrototypeOf(this, FileError.prototype);
  }
}

export async function showSaveFilePicker(suggestedName = "todo.txt") {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.openOrCreateFile(suggestedName);
  }

  const fileHandle = await window.showSaveFilePicker({
    suggestedName,
    startIn: "documents",
    types: [
      {
        description: "Text file",
        accept: { "text/plain": [".txt"] },
      },
    ],
  });
  if (!fileHandle) {
    throw new FileError("PICKER_CLOSED");
  }

  const id = await saveFileHandle(fileHandle);
  const fileData = await fileHandle.getFile();
  const content = await fileData.text();
  return {
    id,
    filename: fileHandle.name,
    content,
  };
}

export async function showOpenFilePicker() {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return await fallbackFilesystem.openOrCreateFile();
  }

  const [fileHandle] = await window.showOpenFilePicker();
  if (!fileHandle) {
    throw new FileError("PICKER_CLOSED");
  }

  const id = await saveFileHandle(fileHandle);
  const filename = fileHandle.name;
  const file: File = await fileHandle.getFile();
  const content = await file.text();
  return {
    id,
    filename,
    content,
  };
}

export async function readFile(id: string) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.readFile(id);
  }

  const fileHandle = await getFileHandle(id);

  const granted = await verifyPermission(fileHandle);
  if (!granted) {
    throw new FileError("PERMISSION_DENIED", fileHandle.name);
  }

  try {
    const fileData = await fileHandle.getFile();
    const content = await fileData?.text();
    return {
      filename: fileHandle.name,
      content,
    };
  } catch (e) {
    console.error("Unable to read file", e);
    throw new FileError("UNKNOWN", fileHandle.name);
  }
}

export async function writeFile({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.writeFile({ id, content });
  }

  const fileHandle = await getFileHandle(id);
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return {
      filename: fileHandle.name,
    };
  } catch (e) {
    console.error("Unable to write file", e);
    throw new FileError("UNKNOWN", fileHandle.name);
  }
}

export async function deleteFile(id: string) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.deleteFile(id);
  }
  await deleteFileHandle(id);
}

async function verifyPermission(fileHandle: FileSystemFileHandle) {
  const options = {
    mode: "readwrite",
  };

  // Check if permission was already granted. If so, return true.
  // @ts-ignore
  if ((await fileHandle.queryPermission(options)) === "granted") {
    return true;
  }

  // Request permission. If the user grants permission, return true.
  // @ts-ignore
  if ((await fileHandle.requestPermission(options)) === "granted") {
    return true;
  }

  // The user didn't grant permission, so return false.
  return false;
}

const fileHandleCache = new Map<string, FileSystemFileHandle>();

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

function getStore(db: IDBDatabase, mode: IDBTransactionMode = "readwrite") {
  const transaction = db.transaction(["fileHandles"], mode);
  return transaction.objectStore("fileHandles");
}

async function saveFileHandle(
  fileHandle: FileSystemFileHandle,
): Promise<string> {
  const db = await openDatabase();
  const id = generateId();
  return new Promise<string>((resolve, reject) => {
    const store = getStore(db, "readwrite");
    const request = store.put({
      id,
      handle: fileHandle,
    } as FileHandleEntry);
    request.onsuccess = () => {
      fileHandleCache.set(id, fileHandle);
      resolve(id);
    };
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  });
}

async function getFileHandle(id: string) {
  if (fileHandleCache.has(id)) {
    return fileHandleCache.get(id) as FileSystemFileHandle;
  }
  const db = await openDatabase();
  const store = getStore(db);
  const request = store.get(id);
  const entry = await getFileHandleFromRequest<FileHandleEntry>(request);
  if (!entry) {
    throw new FileError("RETRIEVAL_FAILED");
  }
  fileHandleCache.set(id, entry.handle);
  return entry.handle;
}

async function deleteFileHandle(id: string) {
  const db = await openDatabase();
  const store = getStore(db, "readwrite");
  const request = store.delete(id);
  fileHandleCache.delete(id);
  return getFileHandleFromRequest<undefined>(request);
}

export async function deleteFilesNotInList(ids: string[]) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.deleteFilesNotInList(ids);
  }
  const db = await openDatabase();
  const store = getStore(db);
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
  await Promise.all(idsNotInList.map(deleteFileHandle));
}

async function getFileHandleFromRequest<T>(
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
