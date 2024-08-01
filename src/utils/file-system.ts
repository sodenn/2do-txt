import { SUPPORTS_REMOVE_FILE } from "@/utils/platform";
import { generateId } from "@/utils/uuid";

interface FileHandleEntry {
  id: string;
  handle: FileSystemFileHandle;
}

export async function readFile(id: string) {
  const fileHandle = await getFileHandleById(id);
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
  const fileHandle = await getFileHandleById(id);
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
  const fileHandle = await getFileHandleById(id);
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
  await deleteFileHandleById(id);
}

export async function storeFileHandle(
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
      resolve(id);
    };
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  });
}

async function deleteFileHandleById(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(["fileHandles"], "readwrite");
  const store = transaction.objectStore("fileHandles");
  const request = store.delete(id);
  return getFileHandle<undefined>(request);
}

async function getFileHandle<T>(request: IDBRequest): Promise<T | undefined> {
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

async function getFileHandleById(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(["fileHandles"], "readonly");
  const store = transaction.objectStore("fileHandles");
  const request = store.get(id);
  return getFileHandle<FileHandleEntry>(request).then((e) => e?.handle);
}

export async function verifyPermission(
  fileHandle: FileSystemFileHandle,
  readWrite = true,
) {
  const options: any = {};
  if (readWrite) {
    options.mode = "readwrite";
  }
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
