interface CreateOptions {
  operation: "create";
  operationId: string;
  filename: string;
}

interface CreateResult {
  operation: "create";
  operationId: string;
  success: true;
  content: string;
  filename: string;
}

interface ReadOptions {
  filename: string;
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
  filename: string;
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
  filename: string;
}

interface DeleteResult {
  operation: "delete";
  operationId: string;
  success: true;
}

type Options = CreateOptions | WriteOptions | ReadOptions | DeleteOptions;

self.onmessage = async (event: MessageEvent<Options>) => {
  const operation = event.data.operation;
  const operationId = event.data.operationId;
  const root = await navigator.storage.getDirectory();

  try {
    if (operation === "create") {
      const filename = event.data.filename;
      const fileHandle = await root.getFileHandle(filename, { create: true });
      const syncHandle = await fileHandle.createSyncAccessHandle();
      const buffer = new ArrayBuffer(syncHandle.getSize());
      syncHandle.read(buffer, { at: 0 });
      syncHandle.close();
      const decoder = new TextDecoder();
      const content = decoder.decode(buffer);
      self.postMessage({
        operation: "create",
        operationId,
        success: true,
        content,
        filename: fileHandle.name,
      } as CreateResult);
    }

    if (operation === "read") {
      const filename = event.data.filename;
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
      const filename = event.data.filename;
      const content = event.data.content;
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
      const filename = event.data.filename;
      await root.removeEntry(filename);
      self.postMessage({
        operation: "delete",
        operationId,
        success: true,
      } as DeleteResult);
    }
  } catch (error) {
    console.error(`${operation} failed`, error);
    self.postMessage({
      operation,
      operationId,
      success: false,
    });
  }
};
