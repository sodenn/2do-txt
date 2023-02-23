import {
  Directory,
  Encoding as CapEncoding,
  Filesystem as CapFilesystem,
} from "@capacitor/filesystem";
import { open, save } from "@tauri-apps/api/dialog";
import { readTextFile, removeFile, writeTextFile } from "@tauri-apps/api/fs";
import { documentDir, join as tauriJoin } from "@tauri-apps/api/path";
import { getPlatform } from "./platform";

interface Filesystem {
  getUri(path: string): Promise<string>;
  readFile(path: string): Promise<string>;
  writeFile(options: WriteFileOptions): Promise<string>;
  deleteFile(path: string): Promise<void>;
  readdir(path: string): Promise<Dir[]>;
  isFile(path: string): Promise<boolean>;
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

function getFilenameFromPath(filePath: string) {
  return filePath.replace(/^.*[\\/]/, "");
}

function getFileNameWithoutEnding(fileName: string) {
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

async function _getUniqueFilePath(
  filePath: string,
  isFile: (path: string) => Promise<boolean>
): Promise<{ filePath: string; fileName: string }> {
  let exists = true;
  let p = filePath;
  let newFilePath = filePath;
  let num = 0;

  while (exists) {
    newFilePath = p;
    exists = await isFile(p);
    num++;
    p = p.replace(/\.[0-9a-z]+$/i, ` ${num}$&`);
  }

  const fileName = getFilenameFromPath(newFilePath);
  return { fileName, filePath: newFilePath };
}

const capFilesystem: Filesystem = {
  async getUri(path: string) {
    return CapFilesystem.getUri({ directory: Directory.Documents, path }).then(
      (result) => result.uri
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
      (result) => result.files.map((file) => ({ name: file.name }))
    );
  },
  async isFile(path: string) {
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
    return _getUniqueFilePath(path, capFilesystem.isFile);
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
  async join(..._: string[]) {
    throw new Error("Not implemented");
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
  async isFile(path: string) {
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
    return _getUniqueFilePath(filePath, desktopFilesystem.isFile);
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

async function getUri(path: string) {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.getUri(path)
    : capFilesystem.getUri(path);
}

async function readFile(path: string) {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.readFile(path)
    : capFilesystem.readFile(path);
}

async function writeFile(options: WriteFileOptions) {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.writeFile(options)
    : capFilesystem.writeFile(options);
}

async function deleteFile(path: string) {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.deleteFile(path)
    : capFilesystem.deleteFile(path);
}

async function readdir(path: string) {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.readdir(path)
    : capFilesystem.readdir(path);
}

async function isFile(path: string) {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.isFile(path)
    : capFilesystem.isFile(path);
}

async function getUniqueFilePath(path: string) {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.getUniqueFilePath(path)
    : capFilesystem.getUniqueFilePath(path);
}

async function selectFolder() {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.selectFolder()
    : capFilesystem.selectFolder();
}

async function selectFile() {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.selectFile()
    : capFilesystem.selectFile();
}

async function saveFile(defaultPath?: string) {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.saveFile(defaultPath)
    : capFilesystem.saveFile(defaultPath);
}

async function join(...paths: string[]) {
  const platform = getPlatform();
  return platform === "desktop"
    ? desktopFilesystem.join(...paths)
    : capFilesystem.join(...paths);
}

export {
  getUri,
  readFile,
  writeFile,
  deleteFile,
  readdir,
  isFile,
  getUniqueFilePath,
  selectFolder,
  selectFile,
  saveFile,
  join,
  getFilenameFromPath,
  getFileNameWithoutEnding,
};
