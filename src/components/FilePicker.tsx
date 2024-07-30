import { Fade } from "@/components/Fade";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useFilterStore } from "@/stores/filter-store";
import { useFilePicker } from "@/utils/useFilePicker";
import { useTask } from "@/utils/useTask";
import {
  ChangeEvent,
  forwardRef,
  HTMLAttributes,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
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

export function FilePicker({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { setFileInput } = useFilePicker();
  const setActiveTaskListId = useFilterStore(
    (state) => state.setActiveTaskListId,
  );
  const { toast } = useToast();
  const { createNewTodoFile, taskLists } = useTask();

  const onDrop = useCallback(
    (
      acceptedFiles: File[],
      _fileRejections: FileRejection[],
      event: DropEvent,
    ) => {
      if (event.type) {
        const fileHandlesPromises = Promise.all(
          [
            // @ts-expect-error
            ...event.dataTransfer.items,
          ]
            .filter((item) => item.kind === "file")
            .map(
              (item) => item.getAsFileSystemHandle() as FileSystemFileHandle,
            ),
        );
      }
      if (
        acceptedFiles.length === 1 &&
        acceptedFiles[0].type === "text/plain"
      ) {
        setFiles(acceptedFiles);
      }
    },
    [],
  );

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  const { onClick, onBlur, onKeyDown, onFocus, tabIndex, ...dropzoneProps } =
    getRootProps();

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target?.files as any);
  };

  const processFiles = useCallback(
    (files?: File[]) => {
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

        const updateFilePath = taskLists.length > 0;

        const id = await createNewTodoFile(file.name, content).catch(() => {
          toast({
            variant: "danger",
            description: t("The file could not be opened"),
          });
        });

        if (updateFilePath && id) {
          setActiveTaskListId(id);
        }
      };

      fileReader.onerror = () => {
        toast({
          variant: "danger",
          description: t("The file could not be opened"),
        });
      };

      fileReader.readAsText(file);
    },
    [createNewTodoFile, toast, setActiveTaskListId, taskLists.length, t],
  );

  const handleClick = (event: any) => {
    event.target.value = null;
  };

  useEffect(() => {
    if (files.length > 0) {
      processFiles(files);
      setFiles([]);
    }
  }, [files, processFiles]);

  return (
    <>
      <input
        data-testid="file-picker"
        style={{ display: "none" }}
        ref={setFileInput}
        accept="text/plain"
        type="file"
        onChange={handleChange}
        onClick={handleClick}
      />
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
    </>
  );
}
