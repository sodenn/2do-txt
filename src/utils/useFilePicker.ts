import { useToast } from "@/components/ui/use-toast";
import { SUPPORTS_REMOVE_FILE } from "@/native-api/platform";
import { useFilePickerStore } from "@/stores/file-picker-store";
import { useFilterStore } from "@/stores/filter-store";
import { useTask } from "@/utils/useTask";
import { generateId } from "@/utils/uuid";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface FileHandleEntry {
  id: string;
  handle: FileSystemFileHandle;
}

export function useFilePicker() {
  const { setFileInput } = useFilePickerStore();
  // const createTodoFile = useCreateTodoFile();
  // const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
  //   null,
  // );
  // const [worker, setWorker] = useState<Worker | null>(null);

  // useEffect(() => {
  //   if (supportsOpenFilePicker()) {
  //     return;
  //   }
  //   const newWorker = new Worker(new URL("../sw.ts", import.meta.url));
  //   newWorker.addEventListener("message", (event) => {
  //     const { operation, success } = event.data;
  //     if (operation === "write" && success) {
  //       alert("File written successfully");
  //     }
  //     if (operation === "delete") {
  //       alert("File deleted");
  //     }
  //   });
  //   setWorker(newWorker);
  //   return () => {
  //     newWorker.terminate();
  //   };
  // }, []);

  const showSaveFilePicker = useCallback(async () => {
    if ("showOpenFilePicker" in window) {
      // @ts-ignore
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: "todo.txt",
        startIn: "documents",
        types: [
          {
            description: "Text file",
            accept: { "text/plain": [".txt"] },
          },
        ],
      });
      const id = await storeFileHandle(fileHandle);
      const filename = fileHandle.name;
      return {
        id,
        filename,
      };
    }
  }, []);

  const showOpenFilePicker = useCallback(async () => {
    if ("showOpenFilePicker" in window) {
      // @ts-ignore
      const [fileHandle] = await window.showOpenFilePicker();
      const id = await storeFileHandle(fileHandle);
      const filename = fileHandle.name;
      const file: File = await fileHandle.getFile();
      const content = await file.text();
      return {
        id,
        filename,
        content,
      };
    }
    // if (worker && inputRef.current) {
    //   const input = inputRef.current;
    //   input.addEventListener(
    //     "click",
    //     (event) => {
    //       // @ts-ignore
    //       event.target.value = null;
    //     },
    //     { once: true },
    //   );
    //   const { content, filename } = await new Promise<{
    //     filename: string;
    //     content: Uint8Array;
    //   }>((resolve, reject) => {
    //     input.addEventListener(
    //       "change",
    //       (event) => {
    //         // @ts-ignore
    //         const files: File[] = event.target?.files;
    //         readFileContent(files)
    //           .then(({ filename, content }) => {
    //             const encoder = new TextEncoder();
    //             const buffer = encoder.encode(content);
    //             resolve({ filename, content: buffer });
    //           })
    //           .catch(reject);
    //       },
    //       { once: true },
    //     );
    //     input.click();
    //   });
    //   const res = await new Promise((resolve, reject) => {
    //     worker.addEventListener(
    //       "message",
    //       (event) => {
    //         const { operation, content } = event.data;
    //         if (operation === "read") {
    //           const decoder = new TextDecoder();
    //           const fileContent = decoder.decode(content);
    //         }
    //       },
    //       { once: true },
    //     );
    //     worker.postMessage({
    //       filename,
    //       content: content,
    //       operation: "write",
    //     });
    //   });
    // }
  }, []);

  return useMemo(
    () => ({
      setFileInput,
      showOpenFilePicker,
      showSaveFilePicker,
    }),
    [setFileInput, showOpenFilePicker, showSaveFilePicker],
  );
}

function useCreateTodoFile() {
  const setActiveTaskListId = useFilterStore(
    (state) => state.setActiveTaskListId,
  );
  const { toast } = useToast();
  const { createNewTodoFile, taskLists } = useTask();
  const { t } = useTranslation();
  return useCallback(
    async ({ filename, content }: { filename: string; content: string }) => {
      const updateFilePath = taskLists.length > 0;

      const todoFileId = await createNewTodoFile(filename, content).catch(
        () => {
          toast({
            variant: "danger",
            description: t("The file could not be opened"),
          });
        },
      );

      if (updateFilePath && todoFileId) {
        setActiveTaskListId(todoFileId);
      }
    },
    [createNewTodoFile, setActiveTaskListId, t, taskLists.length, toast],
  );
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("fileHandlesDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore("fileHandles", { keyPath: "id" });
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

async function storeFileHandle(
  fileHandle: FileSystemFileHandle,
): Promise<string> {
  const db = await openDatabase();
  const id = generateId();
  return new Promise<string>((resolve, reject) => {
    const transaction = db.transaction(["fileHandles"], "readwrite");
    const store = transaction.objectStore("fileHandles");
    const request = store.put({
      id,
      handle: fileHandle,
    } as FileHandleEntry);
    request.onsuccess = () => {
      resolve(id);
    };
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  });
}

async function getAllFileHandles() {
  const db = await openDatabase();
  const transaction = db.transaction(["fileHandles"], "readonly");
  const store = transaction.objectStore("fileHandles");
  const request = store.getAll();
  const handles = await getFileHandle<FileHandleEntry[]>(request);
  return handles || [];
}

async function getFileHandleById(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(["fileHandles"], "readonly");
  const store = transaction.objectStore("fileHandles");
  const request = store.get(id);
  return getFileHandle<FileHandleEntry>(request).then((e) => e?.handle);
}

export async function readFile(id: string) {
  const fileHandle = await getFileHandleById(id);
  if (!fileHandle) {
    throw new Error("Cannot retrieve fileHandle");
  }
  const fileData = await fileHandle.getFile();
  const content = await fileData?.text();
  return {
    filename: fileHandle.name,
    content,
  };
}

export async function writeFile({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  const fileHandle = await getFileHandleById(id);
  if (!fileHandle) {
    throw new Error("Cannot retrieve fileHandle");
  }
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
  return {
    filename: fileHandle.name,
  };
}

export async function deleteFile(id: string) {
  const fileHandle = await getFileHandleById(id);
  if (!fileHandle) {
    throw new Error("Cannot retrieve fileHandle");
  }
  if (SUPPORTS_REMOVE_FILE) {
    // @ts-ignore
    await fileHandle.remove();
  }
  await deleteFileHandleById(id);
}

async function deleteFileHandleById(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(["fileHandles"], "readwrite");
  const store = transaction.objectStore("fileHandles");
  const request = store.delete(id);
  return getFileHandle<undefined>(request);
}

async function getFileHandle<T>(request: IDBRequest): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result as T | undefined;
      if (result) {
        resolve(result);
      } else {
        resolve(undefined);
      }
    };
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  });
}

function readFileContent(files: File[]) {
  return new Promise<{ filename: string; content: string }>(
    (resolve, reject) => {
      if (!files || files.length === 0) {
        return;
      }
      const file = files[0];
      const fileReader = new FileReader();
      fileReader.onloadend = async () => {
        const content = fileReader.result;
        if (typeof content !== "string") {
          return;
        }
        resolve({ filename: file.name, content });
      };
      fileReader.onerror = () => {
        reject("The file could not be opened");
      };
      fileReader.readAsText(file);
    },
  );
}
