import { storeFileHandle } from "@/utils/filesystem";
import { useCallback } from "react";
import * as fallback from "./fallback-filesystem";

export function useFilePicker() {
  const showSaveFilePicker = useCallback(async (suggestedName = "todo.txt") => {
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
    } else {
      const { id, filename } = await fallback.showSaveFilePicker(suggestedName);
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
    } else {
      const { id, filename } = await fallback.showSaveFilePicker();
      return {
        id,
        filename,
      };
    }
  }, []);

  return {
    showOpenFilePicker,
    showSaveFilePicker,
  };
}
