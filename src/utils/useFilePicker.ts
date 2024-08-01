import { storeFileHandle } from "@/utils/file-system";
import { SUPPORTS_SHOW_OPEN_FILE_PICKER } from "@/utils/platform";
import { useCallback, useEffect, useState } from "react";

export function useFilePicker() {
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    if (SUPPORTS_SHOW_OPEN_FILE_PICKER) {
      return;
    }
    const newWorker = new Worker(new URL("../sw.ts", import.meta.url));
    setWorker(newWorker);
    return () => {
      newWorker.terminate();
    };
  }, []);

  const showSaveFilePicker = useCallback(
    async (suggestedName = "todo.txt") => {
      if ("showSaveFilePicker" in window) {
        // @ts-ignore
        const fileHandle = await window.showSaveFilePicker({
          suggestedName,
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
      } else if (worker) {
        return new Promise<{ id: string; filename: string; content: string }>(
          (resolve, reject) => {
            worker.addEventListener(
              "message",
              (event) => {
                const { operation, success, id, content, filename } =
                  event.data;
                debugger;
                if (operation === "write" && success) {
                  const decoder = new TextDecoder();
                  resolve({ id, filename, content: decoder.decode(content) });
                } else {
                  reject();
                }
              },
              { once: true },
            );
            worker.postMessage({
              operation: "open",
            });
          },
        );
      }
    },
    [worker],
  );

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
    } else if (worker) {
      return new Promise<{ id: string; filename: string; content: string }>(
        (resolve, reject) => {
          worker.addEventListener(
            "message",
            (event) => {
              const { operation, success, id, content, filename } = event.data;
              if (operation === "write" && success) {
                const decoder = new TextDecoder();
                resolve({ id, filename, content: decoder.decode(content) });
              } else {
                reject();
              }
            },
            { once: true },
          );
          worker.postMessage({
            operation: "open",
          });
        },
      );
    }
  }, [worker]);

  return {
    showOpenFilePicker,
    showSaveFilePicker,
  };
}
