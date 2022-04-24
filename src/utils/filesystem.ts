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
import { useCallback } from "react";
import { usePlatform } from "./platform";

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

  return fileName === process.env.REACT_APP_DEFAULT_FILE_NAME
    ? filePath.replace(
        new RegExp(`${fileName}$`),
        process.env.REACT_APP_ARCHIVE_FILE_NAME
      )
    : filePath.replace(
        new RegExp(`${fileName}$`),
        `${fileNameWithoutEnding}_${process.env.REACT_APP_ARCHIVE_FILE_NAME}`
      );
}

async function _getUniqueFilePath(
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

export function useFilesystem() {
  const platform = usePlatform();
  const electronFilesystem = useElectronFilesystem();

  const getUri = useCallback(async (options: GetUriOptions) => {
    return Filesystem.getUri(options);
  }, []);

  const readFile = useCallback(async (options: ReadFileOptions) => {
    return Filesystem.readFile(options);
  }, []);

  const writeFile = useCallback(async (options: WriteFileOptions) => {
    return Filesystem.writeFile(options);
  }, []);

  const deleteFile = useCallback(async (options: DeleteFileOptions) => {
    return Filesystem.deleteFile(options);
  }, []);

  const readdir = useCallback(async (options: ReaddirOptions) => {
    return Filesystem.readdir(options);
  }, []);

  const isFile = useCallback(
    async (options: ReadFileOptions) => {
      return readFile(options)
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });
    },
    [readFile]
  );

  const getUniqueFilePath = useCallback(
    async (filePath: string) => {
      return _getUniqueFilePath(filePath, isFile);
    },
    [isFile]
  );

  if (platform === "electron") {
    return electronFilesystem;
  } else {
    return {
      getUri,
      readFile,
      writeFile,
      deleteFile,
      readdir,
      isFile,
      getUniqueFilePath,
    };
  }
}

function useElectronFilesystem() {
  const getUri = useCallback(
    async (options: GetUriOptions): Promise<GetUriResult> => {
      throw new Error("Not implemented");
    },
    []
  );

  const readFile = useCallback(
    async ({ path, encoding }: ReadFileOptions): Promise<ReadFileResult> => {
      const buffer = await window.electron.readFile(path, {
        encoding: encoding ? encoding.toString() : undefined,
      });
      return { data: buffer.toString() };
    },
    []
  );

  const writeFile = useCallback(
    async ({
      path,
      data,
      encoding,
      recursive,
    }: WriteFileOptions): Promise<WriteFileResult> => {
      const { writeFile, mkdir } = window.electron;
      if (recursive) {
        await mkdir(path, { recursive: true }).catch(() => undefined);
      }
      await writeFile(path, data, {
        encoding: encoding ? encoding.toString() : undefined,
      });
      return { uri: path };
    },
    []
  );

  const deleteFile = useCallback(
    async ({ path }: DeleteFileOptions): Promise<void> => {
      await window.electron.deleteFile(path);
    },
    []
  );

  const readdir = useCallback(async (options: ReaddirOptions) => {
    throw new Error("Not implemented");
  }, []);

  const isFile = useCallback(
    async (options: ReadFileOptions) => {
      return readFile(options)
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });
    },
    [readFile]
  );

  const getUniqueFilePath = useCallback(
    async (filePath: string) => {
      return _getUniqueFilePath(filePath, isFile);
    },
    [isFile]
  );

  return {
    getUri,
    readFile,
    writeFile,
    deleteFile,
    readdir,
    isFile,
    getUniqueFilePath,
  };
}
