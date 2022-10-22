import {
  Directory,
  Filesystem,
  GetUriOptions,
  GetUriResult,
  ReaddirOptions,
  ReadFileResult,
  WriteFileResult,
} from "@capacitor/filesystem";
import {
  DeleteFileOptions,
  ReadFileOptions,
  WriteFileOptions,
} from "@capacitor/filesystem/dist/esm/definitions";
import { getPlatform } from "./platform";

declare global {
  interface Window {
    electron: {
      readFile: (
        path: string,
        options?: { encoding?: string | null | undefined }
      ) => Promise<Buffer>;
      writeFile: (
        path: string,
        data: string,
        options?: { encoding?: string | null | undefined }
      ) => Promise<void>;
      deleteFile: (path: string) => Promise<void>;
      mkdir: (path: string, options?: { recursive: boolean }) => Promise<void>;
      saveFile: (fileName: string) => Promise<string | undefined>;
    };
  }
}

export function getFilenameFromPath(filePath: string) {
  return filePath.replace(/^.*[\\/]/, "");
}

export function getFileNameWithoutEnding(fileName: string) {
  const fileNameWithoutEnding = fileName.match(/(.+?)(\.[^.]*$|$)/);

  if (
    !fileNameWithoutEnding ||
    fileNameWithoutEnding.length < 2 ||
    fileNameWithoutEnding[1].startsWith(".")
  ) {
    return;
  }

  return fileNameWithoutEnding[1];
}

export function getArchiveFilePath(filePath: string) {
  const fileName = getFilenameFromPath(filePath);
  const fileNameWithoutEnding = getFileNameWithoutEnding(fileName);
  if (!fileNameWithoutEnding) {
    return;
  }

  return fileName === import.meta.env.VITE_DEFAULT_FILE_NAME
    ? filePath.replace(
        new RegExp(`${fileName}$`),
        import.meta.env.VITE_ARCHIVE_FILE_NAME!
      )
    : filePath.replace(
        new RegExp(`${fileName}$`),
        `${fileNameWithoutEnding}_${import.meta.env.VITE_ARCHIVE_FILE_NAME}`
      );
}

async function getUniqueFilePath(
  filePath: string,
  isFile: (options: ReadFileOptions) => Promise<boolean>
): Promise<{ filePath: string; fileName: string }> {
  let exists = true;
  let p = filePath;
  let newFilePath = filePath;
  let num = 0;

  while (exists) {
    newFilePath = p;
    exists = await isFile({
      directory: Directory.Documents,
      path: p,
    });
    num++;
    p = p.replace(/\.[0-9a-z]+$/i, ` ${num}$&`);
  }

  const fileName = getFilenameFromPath(newFilePath);
  return { fileName, filePath: newFilePath };
}

const defaultFilesystem = Object.freeze({
  async getUri(options: GetUriOptions) {
    return Filesystem.getUri(options);
  },
  async readFile(options: ReadFileOptions) {
    return Filesystem.readFile(options);
  },
  async writeFile(options: WriteFileOptions) {
    return Filesystem.writeFile(options);
  },
  async deleteFile(options: DeleteFileOptions) {
    return Filesystem.deleteFile(options);
  },
  async readdir(options: ReaddirOptions) {
    return Filesystem.readdir(options);
  },
  async isFile(options: ReadFileOptions) {
    return defaultFilesystem
      .readFile(options)
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  },
  async getUniqueFilePath(filePath: string) {
    return getUniqueFilePath(filePath, defaultFilesystem.isFile);
  },
});

const electronFilesystem = Object.freeze({
  async getUri(options: GetUriOptions): Promise<GetUriResult> {
    throw new Error("Not implemented");
  },
  async readFile({ path, encoding }: ReadFileOptions): Promise<ReadFileResult> {
    const buffer = await window.electron.readFile(path, {
      encoding: encoding ? encoding.toString() : undefined,
    });
    return { data: buffer.toString() };
  },
  async writeFile({
    path,
    data,
    encoding,
    recursive,
  }: WriteFileOptions): Promise<WriteFileResult> {
    const { writeFile, mkdir } = window.electron;
    if (recursive) {
      await mkdir(path, { recursive: true }).catch(() => undefined);
    }
    await writeFile(path, data, {
      encoding: encoding ? encoding.toString() : undefined,
    });
    return { uri: path };
  },
  async deleteFile({ path }: DeleteFileOptions): Promise<void> {
    await window.electron.deleteFile(path);
  },
  async readdir(options: ReaddirOptions) {
    throw new Error("Not implemented");
  },
  async isFile(options: ReadFileOptions): Promise<boolean> {
    return electronFilesystem
      .readFile(options)
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  },
  async getUniqueFilePath(filePath: string) {
    return getUniqueFilePath(filePath, electronFilesystem.isFile);
  },
});

export function getFilesystem() {
  const platform = getPlatform();
  return platform === "electron" ? electronFilesystem : defaultFilesystem;
}
