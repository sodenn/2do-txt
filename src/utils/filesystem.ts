import {
  Directory,
  Encoding,
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
import { WithOptional } from "../types/common.types";
import { getPlatform } from "./platform";

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

export function getDoneFilePath(filePath: string) {
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
  async getUri({
    directory = Directory.Documents,
    ...options
  }: WithOptional<GetUriOptions, "directory">) {
    return Filesystem.getUri({ directory, ...options });
  },
  async readFile({
    directory = Directory.Documents,
    encoding = Encoding.UTF8,
    ...options
  }: ReadFileOptions) {
    return Filesystem.readFile({ directory, encoding, ...options });
  },
  async writeFile({
    directory = Directory.Documents,
    ...options
  }: WriteFileOptions) {
    return Filesystem.writeFile({ directory, ...options });
  },
  async deleteFile({
    directory = Directory.Documents,
    ...options
  }: DeleteFileOptions) {
    return Filesystem.deleteFile({ directory, ...options });
  },
  async readdir({
    directory = Directory.Documents,
    ...options
  }: ReaddirOptions) {
    return Filesystem.readdir({ directory, ...options });
  },
  async isFile({
    directory = Directory.Documents,
    ...options
  }: ReadFileOptions) {
    return defaultFilesystem
      .readFile({ directory, ...options })
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
  async selectFolder(): Promise<string | undefined> {
    throw new Error("Not implemented");
  },
  async join(...paths: string[]): Promise<string> {
    throw new Error("Not implemented");
  },
});

const electronFilesystem = Object.freeze({
  async getUri(
    options: WithOptional<GetUriOptions, "directory">
  ): Promise<GetUriResult> {
    throw new Error("Not implemented");
  },
  async readFile({
    path,
    encoding = Encoding.UTF8,
  }: ReadFileOptions): Promise<ReadFileResult> {
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
  async selectFolder(buttonLabel?: string): Promise<string | undefined> {
    return window.electron.selectFolder(buttonLabel);
  },
  async join(...paths: string[]): Promise<string> {
    return window.electron.join(paths);
  },
});

export function getFilesystem() {
  const platform = getPlatform();
  return platform === "electron" ? electronFilesystem : defaultFilesystem;
}
