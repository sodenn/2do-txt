import { db } from "@/utils/db";
import { SUPPORTS_SHOW_OPEN_FILE_PICKER } from "@/utils/platform";
import * as privateFilesystem from "./private-filesystem";

type FileErrorReason =
  | "PICKER_CLOSED"
  | "RETRIEVAL_FAILED"
  | "PERMISSION_DENIED"
  | "UNKNOWN";

export class FileError extends Error {
  reason: FileErrorReason;
  filename?: string;
  private static reasonMessages: Record<FileErrorReason, string> = {
    PICKER_CLOSED: "File picker was closed without selecting a file",
    RETRIEVAL_FAILED: "Failed to retrieve file handle from database",
    PERMISSION_DENIED: "File access denied.",
    UNKNOWN: "Unable to access the file due to an unknown problem",
  };
  constructor(reason: FileErrorReason, filename?: string) {
    const message =
      FileError.reasonMessages[reason] || "An unknown file error occurred";
    super(message);
    this.name = "FileError";
    this.reason = reason;
    this.filename = filename;
    Object.setPrototypeOf(this, FileError.prototype);
  }
}

const fileHandlesCache = new Map<number, FileSystemFileHandle>();

export async function showSaveFilePicker(suggestedName = "todo.txt") {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return privateFilesystem.createFile(suggestedName);
  }

  const handle = await window.showSaveFilePicker({
    suggestedName,
    startIn: "documents",
    types: [
      {
        description: "Text file",
        accept: { "text/plain": [".txt"] },
      },
    ],
  });
  if (!handle) {
    throw new FileError("PICKER_CLOSED");
  }

  const { id } = await db.fileHandles.create({ handle: handle });
  fileHandlesCache.set(id, handle);

  const fileData = await handle.getFile();
  const content = await fileData.text();
  return {
    id,
    filename: handle.name,
    content,
  };
}

export async function showOpenFilePicker() {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return await privateFilesystem.createFile();
  }

  const [handle] = await window.showOpenFilePicker();
  if (!handle) {
    throw new FileError("PICKER_CLOSED");
  }

  const { id } = await db.fileHandles.create({ handle });
  fileHandlesCache.set(id, handle);

  const filename = handle.name;
  const file: File = await handle.getFile();
  const content = await file.text();
  return {
    id,
    filename,
    content,
  };
}

export async function readFile(id: number) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return privateFilesystem.readFile(id);
  }

  const { handle } = fileHandlesCache.has(id)
    ? { handle: fileHandlesCache.get(id)! }
    : await db.fileHandles.read(id);

  try {
    const fileData = await handle.getFile();
    const content = await fileData?.text();
    return {
      filename: handle.name,
      content,
    };
  } catch (e) {
    console.error("Unable to read file", e);
    throw new FileError("UNKNOWN", handle.name);
  }
}

export async function writeFile({
  id,
  content,
}: {
  id: number;
  content: string;
}) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return privateFilesystem.writeFile({ id, content });
  }

  const { handle } = fileHandlesCache.has(id)
    ? { handle: fileHandlesCache.get(id)! }
    : await db.fileHandles.read(id);

  const { update } = await verifyPermission(handle);
  if (update) {
    // update clone in indexDb
    await db.fileHandles.update({ id, handle });
  }

  try {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return {
      filename: handle.name,
    };
  } catch (e) {
    console.error("Unable to write file", e);
    throw new FileError("UNKNOWN", handle.name);
  }
}

export async function deleteFile(id: number) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    await privateFilesystem.deleteFile(id);
    return;
  }
  await db.fileHandles.delete(id);
}

export async function deleteFilesNotInList(ids: number[]) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    await privateFilesystem.deleteFilesNotInList(ids);
    return;
  }
  await db.fileHandles.deleteNotInList(ids);
}

async function verifyPermission(fileHandle: FileSystemFileHandle) {
  try {
    const options = {
      mode: "readwrite",
    } as const;

    // Check if permission was already granted. If so, return true.
    if ((await fileHandle.queryPermission(options)) === "granted") {
      return { granted: true, update: false };
    }

    // Request permission. If the user grants permission, return true.
    if ((await fileHandle.requestPermission(options)) === "granted") {
      return { granted: true, update: true };
    }

    // The user didn't grant permission, so return false.
    return { granted: false, update: false };
  } catch (error) {
    // this can fail with a DOMException
    console.error("Unable to verify permission", error);
    return { granted: false, update: false, error };
  }
}
