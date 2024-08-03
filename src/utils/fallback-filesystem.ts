import type {
  DeleteNotInListOptions,
  DeleteNotInListResult,
  DeleteOptions,
  DeleteResult,
  OpenOptions,
  OpenResult,
  ReadOptions,
  ReadResult,
  WriteOptions,
  WriteResult,
} from "@/sw";

const worker = new Worker(new URL("../sw.ts", import.meta.url));

export async function showSaveFilePicker(suggestedName = "todo.txt") {
  return new Promise<{ id: string; filename: string; content: string }>(
    (resolve, reject) => {
      worker.addEventListener(
        "message",
        (event: MessageEvent<OpenResult>) => {
          const { operation, success, id, content, filename } = event.data;
          if (operation === "open" && success) {
            resolve({ id, filename, content });
          } else {
            reject();
          }
        },
        { once: true },
      );
      worker.postMessage({
        operation: "open",
        suggestedName,
      } as OpenOptions);
    },
  );
}

export async function readFile(id: string) {
  return new Promise<{ filename: string; content: string }>(
    (resolve, reject) => {
      worker.addEventListener(
        "message",
        (event: MessageEvent<ReadResult>) => {
          const { operation, success } = event.data;
          if (operation === "read" && success) {
            const { content, filename } = event.data;
            resolve({ filename, content });
          } else {
            reject();
          }
        },
        { once: true },
      );
      worker.postMessage({
        operation: "read",
        id,
      } as ReadOptions);
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
    worker.addEventListener(
      "message",
      (event: MessageEvent<WriteResult>) => {
        const { operation, success } = event.data;
        if (operation === "write" && success) {
          const filename = event.data.filename;
          resolve({ filename });
        } else {
          reject();
        }
      },
      { once: true },
    );
    worker.postMessage({
      operation: "write",
      id,
      content,
    } as WriteOptions);
  });
}

export async function deleteFile(id: string) {
  return new Promise((resolve, reject) => {
    worker.addEventListener(
      "message",
      (event: MessageEvent<DeleteResult>) => {
        const { operation, success } = event.data;
        if (operation === "delete" && success) {
          resolve(undefined);
        } else {
          reject();
        }
      },
      { once: true },
    );
    worker.postMessage({
      operation: "delete",
      id,
    } as DeleteOptions);
  });
}

export async function deleteFilesNotInList(ids: string[]) {
  return new Promise((resolve, reject) => {
    worker.addEventListener(
      "message",
      (event: MessageEvent<DeleteNotInListResult>) => {
        const { operation, success } = event.data;
        if (operation === "delete-not-in-list" && success) {
          resolve(undefined);
        } else {
          reject();
        }
      },
      { once: true },
    );
    worker.postMessage({
      operation: "delete-not-in-list",
      ids,
    } as DeleteNotInListOptions);
  });
}
