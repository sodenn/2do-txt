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
      selectFolder: (buttonLabel?: string) => Promise<string | undefined>;
      join: (paths: string[]) => Promise<string>;
      getSecureStorageItem: (key: string) => Promise<string | null>;
      setSecureStorageItem: (key: string, value: string) => Promise<void>;
      removeSecureStorageItem: (key: string) => Promise<void>;
      hideSplashScreen: () => Promise<void>;
    };
  }
}

export {};
