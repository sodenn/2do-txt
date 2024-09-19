import { db } from "@/utils/db";
import { TEST_MODE } from "@/utils/platform";
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

let worker: Worker;
if (typeof Worker !== "undefined") {
  worker = new Worker(new URL("./private-filesystem-sw.ts", import.meta.url));
}

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
  if (TEST_MODE) {
    return createTestFile(suggestedName);
  }
  const filename = await db.files.getNextFreeFilename(suggestedName);
  const { content } = await postMessage({
    operation: "create",
    filename,
  });
  const { id } = await db.files.create({ filename });
  return { id, filename, content };
}

async function createTestFile(suggestedName = "todo.txt") {
  const filename = await db.files.getNextFreeFilename(suggestedName);
  const content = "";
  const { id } = await db.files.create({
    filename,
    content,
  });
  return {
    id,
    filename,
    content,
  };
}

export async function readFile(id: number) {
  if (TEST_MODE) {
    return readTestFile(id);
  }
  const { filename } = await db.files.read(id);
  const { content } = await postMessage({
    operation: "read",
    filename,
  });
  return {
    content,
    filename,
  };
}

async function readTestFile(id: number) {
  const { filename, content } = await db.files.read(id);
  return {
    content,
    filename,
  };
}

export async function writeFile({
  id,
  content,
}: {
  id: number;
  content: string;
}) {
  if (TEST_MODE) {
    return writeTestFile({ id, content });
  }
  const { filename } = await db.files.read(id);
  await postMessage({
    operation: "write",
    filename,
    content,
  });
  return { filename };
}

async function writeTestFile({ id, content }: { id: number; content: string }) {
  const { filename } = await db.files.update({ id, content });
  return { filename };
}

export async function deleteFile(id: number) {
  if (TEST_MODE) {
    return deleteTestFile(id);
  }
  const { filename } = await db.files.read(id);
  await postMessage({
    operation: "delete",
    filename,
  });
  await db.files.delete(id);
}

async function deleteTestFile(id: number) {
  await db.files.delete(id);
}

export async function deleteFilesNotInList(ids: number[]) {
  if (TEST_MODE) {
    return deleteTestFilesNotInList(ids);
  }
  await db.files.deleteNotInList(ids);
}

async function deleteTestFilesNotInList(ids: number[]) {
  await db.files.deleteNotInList(ids);
}
