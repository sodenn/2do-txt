import { Db } from "@/utils/db";
import { SUPPORTS_SHOW_OPEN_FILE_PICKER } from "@/utils/platform";
import * as fallbackFilesystem from "./fallback-filesystem";

interface DbEntry {
  id: string;
  handle: FileSystemFileHandle;
}

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

const db = new Db<DbEntry>("filehandles");

export async function showSaveFilePicker(suggestedName = "todo.txt") {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.createFile(suggestedName);
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

  const id = await db.create({ handle: handle });
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
    return await fallbackFilesystem.createFile();
  }

  const [handle] = await window.showOpenFilePicker();
  if (!handle) {
    throw new FileError("PICKER_CLOSED");
  }

  const id = await db.create({ handle });
  const filename = handle.name;
  const file: File = await handle.getFile();
  const content = await file.text();
  return {
    id,
    filename,
    content,
  };
}

export async function readFile(id: string) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.readFile(id);
  }

  const { handle } = await db.read(id);

  const granted = await verifyPermission(handle);
  if (!granted) {
    throw new FileError("PERMISSION_DENIED", handle.name);
  }

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
  id: string;
  content: string;
}) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return fallbackFilesystem.writeFile({ id, content });
  }

  const { handle } = await db.read(id);
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

export async function deleteFile(id: string) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    await fallbackFilesystem.deleteFile(id);
  }
  await db.delete(id);
}

export async function deleteFilesNotInList(ids: string[]) {
  if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    await fallbackFilesystem.deleteFilesNotInList(ids);
  }
  await db.deleteNotInList(ids);
}

async function verifyPermission(fileHandle: FileSystemFileHandle) {
  try {
    const options = {
      mode: "readwrite",
    };

    // Check if permission was already granted. If so, return true.
    // @ts-ignore
    if ((await fileHandle.queryPermission(options)) === "granted") {
      return true;
    }

    // Request permission. If the user grants permission, return true.
    // @ts-ignore
    if ((await fileHandle.requestPermission(options)) === "granted") {
      return true;
    }

    // The user didn't grant permission, so return false.
    return false;
  } catch (e) {
    throw new FileError("PERMISSION_DENIED", fileHandle.name);
  }
}
