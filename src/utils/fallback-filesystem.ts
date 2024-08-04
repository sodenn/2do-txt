import { generateId } from "@/utils/uuid";

interface WithOperationId {
  operationId: string;
}

interface SuccessfulResult {
  success: true;
}

interface OpenOptions {
  operation: "open";
  suggestedName: string;
}

interface OpenResult extends WithOperationId, SuccessfulResult {
  id: string;
  content: string;
  filename: string;
}

interface ReadOptions {
  operation: "read";
  id: string;
}

interface ReadResult extends WithOperationId, SuccessfulResult {
  content: string;
  filename: string;
}

interface WriteOptions {
  operation: "write";
  content: string;
  id: string;
}

interface WriteResult extends WithOperationId, SuccessfulResult {
  filename: string;
}

interface DeleteOptions {
  operation: "delete";
  id: string;
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
  | OpenOptions
  | ReadOptions
  | WriteOptions
  | DeleteOptions
  | DeleteNotInListOptions
  | GetNextFreeFilenameOptions
  | ErrorOptions;

type Result =
  | OpenResult
  | ReadResult
  | WriteResult
  | DeleteResult
  | DeleteNotInListResult
  | GetNextFreeFilenameResult
  | ErrorResult;

interface Callback {
  success: (data: any) => void;
  error: () => void;
  operationId: string;
}

type PostMessageOptions = Options & Omit<Callback, "operationId">;

const callbacks: Callback[] = [];

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

const worker = new Worker(new URL("../sw.ts", import.meta.url));
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
    callback.error();
    callbacks.splice(callbackIndex, 1);
  }
});

export async function openOrCreateFile(suggestedName = "todo.txt") {
  return new Promise<{ id: string; filename: string; content: string }>(
    (resolve, reject) => {
      postMessage({
        operation: "open",
        suggestedName,
        error: reject,
        success: async ({ id, filename, content }: OpenResult) => {
          resolve({ id, filename, content });
        },
      });
    },
  );
}

export async function readFile(id: string) {
  return new Promise<{ filename: string; content: string }>(
    (resolve, reject) => {
      postMessage({
        operation: "read",
        id,
        error: reject,
        success: async ({ content, filename }: OpenResult) => {
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
  return new Promise<{ filename: string }>((resolve, reject) => {
    postMessage({
      operation: "write",
      id,
      content,
      error: reject,
      success: async ({ filename }: OpenResult) => {
        resolve({ filename });
      },
    });
  });
}

export async function deleteFile(id: string) {
  return new Promise((resolve, reject) => {
    postMessage({
      operation: "delete",
      id,
      error: reject,
      success: resolve,
    });
  });
}

export async function deleteFilesNotInList(ids: string[]) {
  return new Promise((resolve, reject) => {
    postMessage({
      operation: "delete-not-in-list",
      ids,
      error: reject,
      success: resolve,
    });
  });
}

export async function getNextFreeFilename(filename: string) {
  return new Promise<string>((resolve, reject) => {
    postMessage({
      operation: "get-next-free-filename",
      filename,
      error: reject,
      success: ({ filename }: GetNextFreeFilenameResult) => {
        resolve(filename);
      },
    });
  });
}
