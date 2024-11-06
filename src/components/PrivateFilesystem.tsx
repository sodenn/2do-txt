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
import { usePrivateFilesystemStore } from "@/stores/private-filesystem-store";
import { db } from "@/utils/db";
import {
  HAS_TOUCHSCREEN,
  SUPPORTS_SHOW_OPEN_FILE_PICKER,
} from "@/utils/platform";
import { createFile, writeFile } from "@/utils/private-filesystem";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function PrivateFilesystem() {
  if (SUPPORTS_SHOW_OPEN_FILE_PICKER) {
    return null;
  }
  return (
    <>
      <PrivateFilesystemDialog />
      <PrivateFilesystemInput />
    </>
  );
}

function PrivateFilesystemDialog() {
  const {
    open,
    importFile,
    closePrivateFilesystemDialog,
    callback,
    suggestedFilename,
  } = usePrivateFilesystemStore();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(suggestedFilename);

  const handleCreate = () => {
    createFile(inputValue).then((result) => {
      callback?.(result);
      closePrivateFilesystemDialog();
    });
  };

  const handleClose = useCallback(() => {
    callback?.();
    closePrivateFilesystemDialog();
  }, [callback, closePrivateFilesystemDialog]);

  useEffect(() => {
    setInputValue(suggestedFilename);
  }, [suggestedFilename, open]);

  if (importFile) {
    return null;
  }

  return (
    <ResponsiveDialog open={open} onClose={handleClose}>
      <ResponsiveDialogContent data-testid="create-list-dialog">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("Create list")}</ResponsiveDialogTitle>
          <ResponsiveDialogHiddenDescription>
            Create list
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
            aria-label="Create list"
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

function PrivateFilesystemInput() {
  const { callback, setFileInput, closePrivateFilesystemDialog } =
    usePrivateFilesystemStore();

  const close = (result?: {
    id: number;
    filename: string;
    content: string;
  }) => {
    console.log(result);
    callback?.(result);
    setTimeout(() => {
      closePrivateFilesystemDialog();
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
      const suggestedFilename = await db.files.getNextFreeFilename(file.name);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
