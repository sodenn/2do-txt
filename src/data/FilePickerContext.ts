import { useCallback, useRef } from "react";
import { createContext } from "../utils/Context";

const [FilePickerProvider, useFilePicker] = createContext(() => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  return {
    fileInputRef,
    openFileDialog,
  };
});

export { FilePickerProvider, useFilePicker };
