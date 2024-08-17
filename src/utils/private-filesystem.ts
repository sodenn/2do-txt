import { Db, DbEntry } from "@/utils/db";
import { SUPPORTS_GET_DIRECTORY } from "@/utils/platform";
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

type Result<T> = T extends CreateOptions
  ? CreateResult
  : T extends ReadOptions
    ? ReadResult
    : T extends WriteOptions
      ? WriteResult
      : T extends DeleteOptions
        ? DeleteResult
        : T extends DeleteNotInListOptions
          ? DeleteNotInListResult
          : T extends GetNextFreeFilenameOptions
            ? GetNextFreeFilenameResult
            : T extends ErrorOptions
              ? ErrorResult
              : never;

interface FilenameEntry extends DbEntry {
  filename: string;
}

interface FileEntry extends DbEntry {
  filename: string;
  content: string;
}

class PrivateFilesystemDb<T extends DbEntry> extends Db<T> {
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

const privateFilenamesDb = new PrivateFilesystemDb<FilenameEntry>(
  "private-filesystem-filenames",
);

const privateFilesDb = new PrivateFilesystemDb<FileEntry>(
  "private-filesystem-files",
);

export function getPrivateFilesystemDb() {
  return SUPPORTS_GET_DIRECTORY ? privateFilenamesDb : privateFilesDb;
}

const worker = new Worker(
  new URL("./private-filesystem-sw.ts", import.meta.url),
);

function postMessage<T extends Options>(options: T): Promise<Result<T>> {
  return new Promise<Result<T>>((resolve, reject) => {
    const messageId = generateId();
    const channel = new MessageChannel();

    channel.port1.onmessage = (event) => {
      const { success, messageId: mId, ...other } = event.data;
      if (messageId !== mId) {
        return;
      }
      if (success) {
        resolve(other);
      } else {
        reject(new Error());
      }
      channel.port1.close();
    };

    worker.postMessage({ ...options, messageId }, [channel.port2]);
  });
}

export async function createFile(suggestedName = "todo.txt") {
  if (!SUPPORTS_GET_DIRECTORY) {
    return createTestFile(suggestedName);
  }
  const filename = await privateFilenamesDb.getNextFreeFilename(suggestedName);
  const { content } = await postMessage({
    operation: "create",
    filename,
  });
  const id = await privateFilenamesDb.create({ filename });
  return { id, filename, content };
}

async function createTestFile(suggestedName = "todo.txt") {
  const filename = await privateFilesDb.getNextFreeFilename(suggestedName);
  const content = "";
  const id = await privateFilesDb.create({
    filename,
    content,
  });
  return {
    id,
    filename,
    content,
  };
}

export async function readFile(id: string) {
  if (!SUPPORTS_GET_DIRECTORY) {
    return readTestFile(id);
  }
  const { filename } = await privateFilenamesDb.read(id);
  const { content } = await postMessage({
    operation: "read",
    filename,
  });
  return {
    content,
    filename,
  };
}

async function readTestFile(id: string) {
  const { filename, content } = await privateFilesDb.read(id);
  return {
    content,
    filename,
  };
}

export async function writeFile({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  if (!SUPPORTS_GET_DIRECTORY) {
    return writeTestFile({ id, content });
  }
  const { filename } = await privateFilenamesDb.read(id);
  await postMessage({
    operation: "write",
    filename,
    content,
  });
  return { filename };
}

async function writeTestFile({ id, content }: { id: string; content: string }) {
  const { filename } = await privateFilesDb.update({ id, content });
  return { filename };
}

export async function deleteFile(id: string) {
  if (!SUPPORTS_GET_DIRECTORY) {
    return deleteTestFile(id);
  }
  const { filename } = await privateFilenamesDb.read(id);
  await postMessage({
    operation: "delete",
    filename,
  });
  await privateFilenamesDb.delete(id);
}

async function deleteTestFile(id: string) {
  await privateFilesDb.delete(id);
}

export async function deleteFilesNotInList(ids: string[]) {
  if (!SUPPORTS_GET_DIRECTORY) {
    return deleteTestFilesNotInList(ids);
  }
  await privateFilenamesDb.deleteNotInList(ids);
}

async function deleteTestFilesNotInList(ids: string[]) {
  await privateFilenamesDb.deleteNotInList(ids);
}
