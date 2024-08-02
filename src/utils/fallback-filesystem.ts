const worker = new Worker(new URL("../sw.ts", import.meta.url));

export async function showSaveFilePicker(suggestedName = "todo.txt") {
  return new Promise<{ id: string; filename: string; content: string }>(
    (resolve, reject) => {
      worker.addEventListener(
        "message",
        (event) => {
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
      });
    },
  );
}

export async function readFile(id: string) {
  return new Promise<{ filename: string; content: string }>(
    (resolve, reject) => {
      worker.addEventListener(
        "message",
        (event) => {
          const { operation, success, content, filename } = event.data;
          if (operation === "read" && success) {
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
    worker.addEventListener(
      "message",
      (event) => {
        const { operation, success, filename } = event.data;
        if (operation === "write" && success) {
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
    });
  });
}

export async function deleteFile(id: string) {
  return new Promise((resolve, reject) => {
    worker.addEventListener(
      "message",
      (event) => {
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
    });
  });
}
