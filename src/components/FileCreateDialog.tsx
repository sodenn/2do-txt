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
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { openOrCreateFile } from "@/utils/fallback-filesystem";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function FileCreateDialog() {
  const {
    open,
    closeFileCreateDialog,
    cleanupFileCreateDialog,
    callback,
    suggestedFilename,
  } = useFileCreateDialogStore();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(suggestedFilename);

  const handleCreate = () => {
    openOrCreateFile(inputValue).then((result) => {
      callback?.(result);
      closeFileCreateDialog();
    });
  };

  const handleClose = useCallback(() => {
    closeFileCreateDialog();
    callback?.();
  }, [callback, closeFileCreateDialog]);

  const handleExit = useCallback(() => {
    cleanupFileCreateDialog();
    setInputValue("");
  }, [cleanupFileCreateDialog]);

  useEffect(() => {
    setInputValue(suggestedFilename);
  }, [suggestedFilename]);

  return (
    <ResponsiveDialog open={open} onClose={handleClose} onExit={handleExit}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("Create todo.txt")}</ResponsiveDialogTitle>
          <ResponsiveDialogHiddenDescription>
            Archived tasks
          </ResponsiveDialogHiddenDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="my-1 space-y-2">
            <Label htmlFor="filename">{t(`File Name`)}</Label>
            <Input
              autoFocus
              id="filename"
              type="text"
              min={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full"
              aria-label="Amount"
            />
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button
            onClick={handleCreate}
            aria-label="Create new file"
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
