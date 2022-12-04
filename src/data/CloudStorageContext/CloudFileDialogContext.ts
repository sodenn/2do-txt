import { useState } from "react";
import { createContext } from "../../utils/Context";
import { CloudStorage } from "./cloud-storage.types";

export interface CloudFileDialogOptions {
  open: boolean;
  cloudStorage?: CloudStorage;
}

const [CloudFileDialogProvider, useCloudFileDialog] = createContext(() => {
  const [cloudFileDialogOptions, setCloudFileDialogOptions] =
    useState<CloudFileDialogOptions>({
      open: false,
    });
  return {
    cloudFileDialogOptions,
    setCloudFileDialogOptions,
  };
});

export { CloudFileDialogProvider, useCloudFileDialog };
