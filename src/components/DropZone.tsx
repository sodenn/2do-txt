import { Fade } from "@/components/Fade";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useFilterStore } from "@/stores/filter-store";
import { storeFileHandle } from "@/utils/filesystem";
import { SUPPORTS_DATA_TRANSFER_HANDLER } from "@/utils/platform";
import { useTask } from "@/utils/useTask";
import {
  forwardRef,
  HTMLAttributes,
  PropsWithChildren,
  useCallback,
} from "react";
import { DropEvent, FileRejection, useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";

const Root = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  (props, ref) => (
    <div
      ref={ref}
      data-testid="dropzone"
      {...props}
      data-hotkeys-keep-enabled
      className="sh:h-screen flex h-full flex-col outline-none"
    />
  ),
);

const Overlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    return (
      <div
        ref={ref}
        className="fixed bottom-0 left-0 right-0 top-0 z-[51] bg-background p-2"
        {...props}
      />
    );
  },
);

const StyledCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    return (
      <Card
        ref={ref}
        className="flex h-full w-full items-center justify-center bg-success/5"
        {...props}
      />
    );
  },
);

export function DropZone({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const setActiveTaskListId = useFilterStore(
    (state) => state.setActiveTaskListId,
  );
  const { toast } = useToast();
  const { createNewTodoFile, closeTodoFile, taskLists } = useTask();

  const onDrop = useCallback(
    async (
      _acceptedFiles: File[],
      _fileRejections: FileRejection[],
      event: DropEvent,
    ) => {
      // @ts-expect-error
      const items: DataTransferItemList = event.dataTransfer.items;
      if (items.length !== 1 || items[0].type !== "text/plain") {
        return;
      }
      const fileHandle: FileSystemFileHandle =
        // @ts-ignore
        await items[0].getAsFileSystemHandle();
      // @ts-ignore
      await fileHandle.requestPermission({
        mode: "readwrite",
      });
      const id = await storeFileHandle(fileHandle);
      const fileData = await fileHandle.getFile();
      const content = await fileData.text();
      const updateFilePath = taskLists.length > 0;
      await createNewTodoFile(id, content).catch((error) => {
        console.error("Error creating new file", error);
        closeTodoFile(id);
        toast({
          variant: "danger",
          description: t("The file could not be opened"),
        });
      });
      if (updateFilePath && id) {
        setActiveTaskListId(id);
      }
    },
    [
      t,
      closeTodoFile,
      createNewTodoFile,
      setActiveTaskListId,
      taskLists.length,
      toast,
    ],
  );

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  const { onClick, onBlur, onKeyDown, onFocus, tabIndex, ...dropzoneProps } =
    getRootProps();

  if (!SUPPORTS_DATA_TRANSFER_HANDLER) {
    return children;
  }

  return (
    <Root {...dropzoneProps}>
      <Fade in={isDragActive} unmountOnExit mountOnEnter>
        <Overlay>
          <StyledCard>
            <div className="text-xl font-bold tracking-tight">
              {t("Drop todo.txt file here")}
            </div>
          </StyledCard>
        </Overlay>
      </Fade>
      {children}
    </Root>
  );
}
