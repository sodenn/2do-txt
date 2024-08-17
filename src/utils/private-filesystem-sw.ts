interface CreateOptions {
  operation: "create";
  messageId: string;
  filename: string;
}

interface CreateResult {
  operation: "create";
  messageId: string;
  success: true;
  content: string;
  filename: string;
}

interface ReadOptions {
  filename: string;
  operation: "read";
  messageId: string;
}

interface ReadResult {
  operation: "read";
  messageId: string;
  success: true;
  content: string;
  filename: string;
}

interface WriteOptions {
  operation: "write";
  messageId: string;
  content: string;
  filename: string;
}

interface WriteResult {
  operation: "write";
  messageId: string;
  success: true;
  filename: string;
}

interface DeleteOptions {
  operation: "delete";
  messageId: string;
  filename: string;
}

interface DeleteResult {
  operation: "delete";
  messageId: string;
  success: true;
}

type Options = CreateOptions | WriteOptions | ReadOptions | DeleteOptions;

self.onmessage = async (event: MessageEvent<Options>) => {
  const operation = event.data.operation;
  const messageId = event.data.messageId;
  const root = await navigator.storage.getDirectory();
  const communicationPort = event.ports[0];

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
      communicationPort.postMessage({
        operation: "create",
        messageId,
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
      communicationPort.postMessage({
        operation: "read",
        messageId,
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
      communicationPort.postMessage({
        operation: "write",
        messageId,
        success: true,
        filename: fileHandle.name,
      } as WriteResult);
    }

    if (operation === "delete") {
      const filename = event.data.filename;
      await root.removeEntry(filename);
      communicationPort.postMessage({
        operation: "delete",
        messageId,
        success: true,
      } as DeleteResult);
    }
  } catch (error) {
    console.error(`${operation} failed`, error);
    communicationPort.postMessage({
      operation,
      messageId,
      success: false,
    });
  }
};
