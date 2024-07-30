interface WriteOperation {
  content: Uint8Array;
  filename: string;
  operation: "write";
}

interface ReadOperation {
  filename: string;
  operation: "read";
}

interface DeleteOperation {
  filename: string;
  operation: "delete";
}

type Operation = WriteOperation | ReadOperation | DeleteOperation;

self.onmessage = async (event: MessageEvent<Operation>) => {
  const operation = event.data.operation;
  const filename = event.data.filename;
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(filename, { create: true });

  if (operation === "read") {
    const syncHandle = await fileHandle.createSyncAccessHandle();
    const buffer = new ArrayBuffer(syncHandle.getSize());
    syncHandle.read(buffer, { at: 0 });
    syncHandle.close();
    self.postMessage({ operation: "read", content: buffer });
  }
  if (operation === "write") {
    const content = event.data.content;
    const syncHandle = await fileHandle.createSyncAccessHandle();
    syncHandle.write(content, { at: 0 });
    syncHandle.close();
    self.postMessage({ operation: "write", success: true });
  }
  if (operation === "delete") {
    await root.removeEntry(filename);
    self.postMessage({ operation: "delete", success: true });
  }
};
