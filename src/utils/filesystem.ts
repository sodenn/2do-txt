import {
  Directory,
  Filesystem,
  GetUriOptions,
  GetUriResult,
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

const _getUniqueFilePath = async (
  filePath: string,
  isFile: (options: ReadFileOptions) => Promise<boolean>
): Promise<{ filePath: string; fileName: string }> => {
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

  const fileName = newFilePath.replace(/^.*[\\/]/, "");
  return { fileName, filePath: newFilePath };
};

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
      const { readFile } = window.electron;
      const buffer = await readFile(path, {
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
      const { deleteFile } = window.electron;
      await deleteFile(path);
    },
    []
  );

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

  return { getUri, readFile, writeFile, deleteFile, isFile, getUniqueFilePath };
}
