import {
  SUPPORTS_REMOVE_FILE,
  SUPPORTS_SHOW_OPEN_FILE_PICKER,
} from "@/utils/platform";
import { generateId } from "@/utils/uuid";
import * as fallbackFilesystem from "./fallback-filesystem";

interface FileHandleEntry {
  id: string;
  handle: FileSystemFileHandle;
}

export async function showSaveFilePicker(suggestedName = "todo.txt") {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.openOrCreateFile(suggestedName);
  }

  // @ts-ignore
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
    return;
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

  // @ts-ignore
  const [fileHandle] = await window.showOpenFilePicker();
  if (!fileHandle) {
    return;
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
  if (!fileHandle) {
    throw new Error("Cannot retrieve fileHandle");
  }
  const fileData = await fileHandle.getFile();
  const content = await fileData?.text();
  return {
    filename: fileHandle.name,
    content,
  };
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
  if (!fileHandle) {
    throw new Error("Cannot retrieve fileHandle");
  }
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
  return {
    filename: fileHandle.name,
  };
}

export async function deleteFile(id: string) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.deleteFile(id);
  }

  const fileHandle = await getFileHandle(id);
  if (!fileHandle) {
    throw new Error("Cannot retrieve fileHandle");
  }
  if (SUPPORTS_REMOVE_FILE) {
    try {
      // @ts-ignore
      await fileHandle.remove();
    } catch (error) {
      console.error(`Cannot delete file ${fileHandle.name}`, error);
    }
  }
  await deleteFileHandle(id);
}

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

const fileHandleCache = new Map<string, FileSystemFileHandle>();

async function saveFileHandle(
  fileHandle: FileSystemFileHandle,
): Promise<string> {
  const db = await openDatabase();
  const id = generateId();
  return new Promise<string>((resolve, reject) => {
    const transaction = db.transaction(["fileHandles"], "readwrite");
    const store = transaction.objectStore("fileHandles");
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
    return fileHandleCache.get(id);
  }
  const db = await openDatabase();
  const transaction = db.transaction(["fileHandles"], "readonly");
  const store = transaction.objectStore("fileHandles");
  const request = store.get(id);
  return getFileHandleFromRequest<FileHandleEntry>(request).then(
    (e) => e?.handle,
  );
}

async function deleteFileHandle(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(["fileHandles"], "readwrite");
  const store = transaction.objectStore("fileHandles");
  const request = store.delete(id);
  return getFileHandleFromRequest<undefined>(request);
}

export async function deleteFilesNotInList(ids: string[]) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.deleteFilesNotInList(ids);
  }

  const db = await openDatabase();
  const transaction = db.transaction(["fileHandles"], "readonly");
  const store = transaction.objectStore("fileHandles");
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
  await Promise.all(idsNotInList.map(deleteFile));
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
