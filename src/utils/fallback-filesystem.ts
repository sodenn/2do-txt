import { Db } from "@/utils/db";
import { generateId } from "@/utils/uuid";

interface WithOperationId {
  operationId: string;
}

interface SuccessfulResult {
  success: true;
}

interface CreateOptions {
  operation: "create";
  filename: string;
}

interface CreateResult extends WithOperationId, SuccessfulResult {
  id: string;
  content: string;
  filename: string;
}

interface ReadOptions {
  operation: "read";
  filename: string;
}

interface ReadResult extends WithOperationId, SuccessfulResult {
  content: string;
  filename: string;
}

interface WriteOptions {
  operation: "write";
  content: string;
  filename: string;
}

interface WriteResult extends WithOperationId, SuccessfulResult {
  filename: string;
}

interface DeleteOptions {
  operation: "delete";
  filename: string;
}

interface DeleteResult extends WithOperationId, SuccessfulResult {}

interface DeleteNotInListOptions {
  operation: "delete-not-in-list";
  ids: string[];
}

interface DeleteNotInListResult extends WithOperationId, SuccessfulResult {}

interface GetNextFreeFilenameOptions {
  operation: "get-next-free-filename";
  filename: string;
}

interface GetNextFreeFilenameResult extends WithOperationId, SuccessfulResult {
  filename: string;
}

interface ErrorResult extends WithOperationId {
  success: false;
}

type Options =
  | CreateOptions
  | ReadOptions
  | WriteOptions
  | DeleteOptions
  | DeleteNotInListOptions
  | GetNextFreeFilenameOptions
  | ErrorOptions;

type Result =
  | CreateResult
  | ReadResult
  | WriteResult
  | DeleteResult
  | DeleteNotInListResult
  | GetNextFreeFilenameResult
  | ErrorResult;

interface Callback {
  success: (data: any) => void;
  error: (error?: any) => void;
  operationId: string;
}

interface DbEntry {
  id: string;
  filename: string;
}

type PostMessageOptions = Options & Omit<Callback, "operationId">;

class FallbackFileSystem extends Db<DbEntry> {
  constructor() {
    super("fallback-filenames");
  }

  async getNextFreeFilename(desiredFileName: string): Promise<string> {
    const parts = desiredFileName.split(".");
    const baseName = parts.slice(0, -1).join(".");
    const extension = parts.length > 1 ? "." + parts[parts.length - 1] : "";
    const store = await this.getStore();

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
        reject(request.error);
      };
    });
  }
}

const callbacks: Callback[] = [];

export const fallbackFileSystemDb = new FallbackFileSystem();

function postMessage({ error, success, ...rest }: PostMessageOptions) {
  const operationId = generateId();
  callbacks.push({
    operationId,
    success,
    error,
  });
  worker.postMessage({
    operationId,
    ...rest,
  });
}

const worker = new Worker(
  new URL("./fallback-filesystem-sw.ts", import.meta.url),
);
worker.addEventListener("message", (event: MessageEvent<Result>) => {
  const { operationId: oId, success, ...rest } = event.data;
  const callbackIndex = callbacks.findIndex(
    ({ operationId }) => operationId === oId,
  );
  const callback = callbackIndex >= 0 ? callbacks[callbackIndex] : undefined;
  if (callback && success) {
    callback.success(rest);
    callbacks.splice(callbackIndex, 1);
  }
  if (callback && !success) {
    callback.error(new Error());
    callbacks.splice(callbackIndex, 1);
  }
});

export async function createFile(suggestedName = "todo.txt") {
  const filename =
    await fallbackFileSystemDb.getNextFreeFilename(suggestedName);
  return new Promise<{ id: string; filename: string; content: string }>(
    (resolve, reject) => {
      postMessage({
        operation: "create",
        filename,
        error: reject,
        success: async ({ filename, content }: CreateResult) => {
          fallbackFileSystemDb
            .write({ filename })
            .then((id) => resolve({ id, filename, content }))
            .catch(reject);
        },
      });
    },
  );
}

export async function readFile(id: string) {
  const { filename } = await fallbackFileSystemDb.read(id);
  return new Promise<{ filename: string; content: string }>(
    (resolve, reject) => {
      postMessage({
        operation: "read",
        filename,
        error: reject,
        success: async ({ content, filename }: ReadResult) => {
          resolve({ content, filename });
        },
      });
    },
  );
}

export async function writeFile({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  const { filename } = await fallbackFileSystemDb.read(id);
  return new Promise<{ filename: string }>((resolve, reject) => {
    postMessage({
      operation: "write",
      filename,
      content,
      error: reject,
      success: async ({ filename }: WriteResult) => {
        resolve({ filename });
      },
    });
  });
}

export async function deleteFile(id: string) {
  const { filename } = await fallbackFileSystemDb.read(id);
  return new Promise<void>((resolve, reject) => {
    postMessage({
      operation: "delete",
      filename,
      error: reject,
      success: () => {
        fallbackFileSystemDb.delete(id).then(resolve).catch(reject);
      },
    });
  });
}

export async function deleteFilesNotInList(ids: string[]) {
  await fallbackFileSystemDb.deleteNotInList(ids);
}
