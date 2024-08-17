import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogHiddenDescription,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useFallbackFileDialogStore } from "@/stores/fallback-file-dialog-store";
import {
  createFile,
  getFallbackFilesystemDb,
  writeFile,
} from "@/utils/fallback-filesystem";
import {
  HAS_TOUCHSCREEN,
  SUPPORTS_SHOW_OPEN_FILE_PICKER,
} from "@/utils/platform";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function FallbackFilesystem() {
  if (SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return null;
  }
  return (
    <>
      <FallbackFileDialog />
      <FallbackFileInput />
    </>
  );
}

function FallbackFileDialog() {
  const {
    open,
    importFile,
    closeFallbackFileDialog,
    callback,
    suggestedFilename,
  } = useFallbackFileDialogStore();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(suggestedFilename);

  const handleCreate = () => {
    createFile(inputValue).then((result) => {
      callback?.(result);
      closeFallbackFileDialog();
    });
  };

  const handleClose = useCallback(() => {
    callback?.();
    closeFallbackFileDialog();
  }, [callback, closeFallbackFileDialog]);

  useEffect(() => {
    setInputValue(suggestedFilename);
  }, [suggestedFilename, open]);

  if (importFile) {
    return null;
  }

  return (
    <ResponsiveDialog open={open} onClose={handleClose}>
      <ResponsiveDialogContent data-testid="file-create-dialog">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("Create todo.txt")}</ResponsiveDialogTitle>
          <ResponsiveDialogHiddenDescription>
            Create file
          </ResponsiveDialogHiddenDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="my-1 space-y-2">
            <Label htmlFor="filename">{t(`File Name`)}</Label>
            <Input
              autoFocus={!HAS_TOUCHSCREEN}
              id="filename"
              type="text"
              min={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full"
              aria-label="Filename"
            />
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button
            onClick={handleCreate}
            aria-label="Create file"
            aria-disabled={!inputValue}
            disabled={!inputValue}
          >
            {t("Create")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function FallbackFileInput() {
  const { callback, setFileInput, closeFallbackFileDialog } =
    useFallbackFileDialogStore();

  const close = (result?: {
    id: string;
    filename: string;
    content: string;
  }) => {
    console.log(result);
    callback?.(result);
    setTimeout(() => {
      closeFallbackFileDialog();
    }, 0);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target as unknown as { files: File[] };
    if (!files || files.length === 0) {
      close();
      return;
    }
    const file = files[0];
    const fileReader = new FileReader();
    fileReader.onloadend = async () => {
      const content = fileReader.result;
      if (typeof content !== "string") {
        return;
      }
      const suggestedFilename =
        await getFallbackFilesystemDb().getNextFreeFilename(file.name);
      const createResult = await createFile(suggestedFilename);
      await writeFile({ id: createResult.id, content });
      close({
        id: createResult.id,
        filename: createResult.filename,
        content,
      });
    };
    fileReader.onerror = () => {
      close();
    };
    fileReader.readAsText(file);
  };

  const handleClick = (event: any) => {
    event.target.value = null;
  };

  return (
    <input
      data-testid="file-picker"
      style={{ display: "none" }}
      ref={setFileInput}
      accept="text/plain"
      type="file"
      onClick={handleClick}
      onChange={handleChange}
    />
  );
}
