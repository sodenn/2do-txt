import {
  Encoding as CapEncoding,
  Filesystem as CapFilesystem,
  Directory,
} from "@capacitor/filesystem";
import { open, save } from "@tauri-apps/api/dialog";
import { readTextFile, removeFile, writeTextFile } from "@tauri-apps/api/fs";
import { documentDir, join as tauriJoin } from "@tauri-apps/api/path";
import { createEventEmitter } from "../utils/event-emitter";
import { getPlatform } from "./platform";

interface Filesystem {
  getUri(path: string): Promise<string>;
  readFile(path: string): Promise<string>;
  writeFile(options: WriteFileOptions): Promise<string>;
  deleteFile(path: string): Promise<void>;
  readdir(path: string): Promise<Dir[]>;
  fileExists(path: string): Promise<boolean>;
  getUniqueFilePath(filePath: string): Promise<UniqueFilePath>;
  selectFolder(): Promise<string | undefined>;
  selectFile(): Promise<string | undefined>;
  saveFile(defaultPath?: string): Promise<string | undefined>;
  join(...paths: string[]): Promise<string>;
}

interface UniqueFilePath {
  filePath: string;
  fileName: string;
}

interface WriteFileOptions {
  path: string;
  data: string;
}

interface Dir {
  name: string;
}

function getDirname(path: string) {
  // Replace any backslashes with forward slashes (for Windows compatibility)
  path = path.replace(/\\/g, "/");
  // Remove any trailing slashes
  path = path.replace(/\/+$/, "");
  // Split the path into an array of directories
  const parts = path.split("/");
  // Remove the last part (i.e. the file or directory name)
  parts.pop();
  // Join the remaining parts back together to form the directory name
  const dirname = parts.length > 0 ? parts.join("/") : "/";
  // If the parent directory is empty, set it to the root directory
  if (dirname === "") {
    return "/";
  }
  return dirname;
}

function getFilename(path: string) {
  return path.replace(/^.*[\\/]/, "");
}

function getFileNameWithoutExt(path: string) {
  const filename = getFilename(path);
  return filename.split(".").slice(0, -1).join(".");
}

async function _getUniqueFilePath(
  filePath: string,
  fileExists: (path: string) => Promise<boolean>,
): Promise<{ filePath: string; fileName: string }> {
  let exists = true;
  let p = filePath;
  let newFilePath = filePath;
  let num = 0;

  while (exists) {
    newFilePath = p;
    exists = await fileExists(p);
    num++;
    p = p.replace(/\.[0-9a-z]+$/i, ` ${num}$&`);
  }

  const fileName = getFilename(newFilePath);
  return { fileName, filePath: newFilePath };
}

const capFilesystem: Filesystem = {
  async getUri(path: string) {
    return CapFilesystem.getUri({ directory: Directory.Documents, path }).then(
      (result) => result.uri,
    );
  },
  async readFile(path: string) {
    return CapFilesystem.readFile({
      directory: Directory.Documents,
      encoding: CapEncoding.UTF8,
      path,
    }).then((result) => result.data);
  },
  async writeFile(options: WriteFileOptions) {
    return CapFilesystem.writeFile({
      directory: Directory.Documents,
      encoding: CapEncoding.UTF8,
      ...options,
    }).then((result) => result.uri);
  },
  async deleteFile(path: string) {
    return CapFilesystem.deleteFile({ directory: Directory.Documents, path });
  },
  async readdir(path: string) {
    return CapFilesystem.readdir({ directory: Directory.Documents, path }).then(
      (result) => result.files.map((file) => ({ name: file.name })),
    );
  },
  async fileExists(path: string) {
    return capFilesystem
      .readFile(path)
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  },
  async getUniqueFilePath(path: string) {
    return _getUniqueFilePath(path, capFilesystem.fileExists);
  },
  async selectFolder() {
    throw new Error("Not implemented");
  },
  async selectFile() {
    throw new Error("Not implemented");
  },
  async saveFile(_?: string) {
    throw new Error("Not implemented");
  },
  async join(...parts: string[]) {
    return parts
      .map((part, i) => {
        if (i === 0) {
          // remove trailing slashes (keep the leading slash on the first part)
          return part.trim().replace(/\/*$/g, "");
        } else if (i === parts.length - 1) {
          // remove leading slash (keep the trailing slash on the last part)
          return part.trim().replace(/^\/*/g, "");
        } else {
          // remove leading + trailing slashes
          return part.trim().replace(/(^\/*|\/*$)/g, "");
        }
      })
      .join("/");
  },
};

const desktopFilesystem: Filesystem = {
  async getUri(_: string) {
    throw new Error("Not implemented");
  },
  async readFile(path: string) {
    return await readTextFile(path);
  },
  async writeFile({ path, data }: WriteFileOptions) {
    await writeTextFile(path, data);
    return path;
  },
  async deleteFile(path: string) {
    await removeFile(path);
  },
  async readdir(_: string) {
    throw new Error("Not implemented");
  },
  async fileExists(path: string) {
    return desktopFilesystem
      .readFile(path)
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  },
  async getUniqueFilePath(path: string) {
    const docDir = await documentDir();
    const filePath = await tauriJoin(docDir, path);
    return _getUniqueFilePath(filePath, desktopFilesystem.fileExists);
  },
  async selectFolder() {
    const path: any = await open({
      directory: true,
      multiple: false,
      defaultPath: await documentDir(),
    });
    return path || undefined;
  },
  async selectFile() {
    const filePath = await open({
      directory: false,
      multiple: false,
      defaultPath: await documentDir(),
    });
    return Array.isArray(filePath) && filePath.length > 0
      ? filePath[0]
      : typeof filePath === "string"
      ? filePath
      : undefined;
  },
  async saveFile(filePath: string) {
    const docDir = await documentDir();
    const defaultPath = await tauriJoin(docDir, filePath);
    const path = await save({
      defaultPath,
    });
    return path ?? undefined;
  },
  async join(...paths: string[]) {
    return await tauriJoin(...paths);
  },
};

export interface CreateFileData {
  path: string;
  content: string;
}

export interface UpdateFileData {
  path: string;
  content: string;
}

export interface DeleteFileData {
  path: string;
}

interface FilesystemEventMap {
  create: CreateFileData;
  update: UpdateFileData;
  delete: DeleteFileData;
}

export const filesystemEmitter = createEventEmitter<FilesystemEventMap>();

async function getFilesystem() {
  const platform = getPlatform();
  return platform === "desktop" ? desktopFilesystem : capFilesystem;
}

async function getUri(path: string) {
  const filesystem = await getFilesystem();
  return filesystem.getUri(path);
}

async function readFile(path: string) {
  const filesystem = await getFilesystem();
  return filesystem.readFile(path);
}

async function writeFile(options: WriteFileOptions) {
  const filesystem = await getFilesystem();
  const exist = await filesystem.fileExists(options.path);
  const path = await filesystem.writeFile(options);
  filesystemEmitter.emit(exist ? "update" : "create", {
    path: options.path,
    content: options.data,
  });
  return path;
}

async function deleteFile(path: string) {
  const filesystem = await getFilesystem();
  await filesystem.deleteFile(path);
  filesystemEmitter.emit("delete", { path });
}

async function readdir(path: string) {
  const filesystem = await getFilesystem();
  return filesystem.readdir(path);
}

async function fileExists(path: string) {
  const filesystem = await getFilesystem();
  return filesystem.fileExists(path);
}

async function getUniqueFilePath(path: string) {
  const filesystem = await getFilesystem();
  return filesystem.getUniqueFilePath(path);
}

async function selectFolder() {
  const filesystem = await getFilesystem();
  return filesystem.selectFolder();
}

async function selectFile() {
  const filesystem = await getFilesystem();
  return filesystem.selectFile();
}

async function saveFile(defaultPath?: string) {
  const filesystem = await getFilesystem();
  const path = await filesystem.saveFile(defaultPath);
  if (path) {
    filesystemEmitter.emit("create", { path: path, content: "" });
  }
  return path;
}

async function join(...paths: string[]) {
  const filesystem = await getFilesystem();
  return filesystem.join(...paths);
}

export {
  deleteFile,
  fileExists,
  getDirname,
  getFileNameWithoutExt,
  getFilename,
  getUniqueFilePath,
  getUri,
  join,
  readFile,
  readdir,
  saveFile,
  selectFile,
  selectFolder,
  writeFile,
};
