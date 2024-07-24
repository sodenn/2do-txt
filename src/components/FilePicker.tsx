import { Fade } from "@/components/Fade";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useFilterStore } from "@/stores/filter-store";
import { usePlatformStore } from "@/stores/platform-store";
import { useFilePicker } from "@/utils/useFilePicker";
import { useTask } from "@/utils/useTask";
import { listen } from "@tauri-apps/api/event";
import {
  ChangeEvent,
  forwardRef,
  HTMLAttributes,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDropzone } from "react-dropzone";
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
  const platform = usePlatformStore((state) => state.platform);
  if (platform === "desktop") {
    return <DesktopFilePicker>{children}</DesktopFilePicker>;
  }
  return <WebFilePicker>{children}</WebFilePicker>;
}

function WebFilePicker({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { setFileInput } = useFilePicker();
  const setActiveTaskListPath = useFilterStore(
    (state) => state.setActiveTaskListPath,
  );
  const { toast } = useToast();
  const { createNewTodoFile, taskLists } = useTask();
  const platform = usePlatformStore((state) => state.platform);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 1 && acceptedFiles[0].type === "text/plain") {
      setFiles(acceptedFiles);
    }
  }, []);

  const clearFiles = useCallback(() => setFiles([]), []);

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

        const filePath = await createNewTodoFile(file.name, content).catch(
          () => {
            toast({
              variant: "danger",
              description: t("The file could not be opened"),
            });
          },
        );

        if (updateFilePath && filePath) {
          setActiveTaskListPath(filePath);
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
    [createNewTodoFile, toast, setActiveTaskListPath, taskLists.length, t],
  );

  const handleClick = (event: any) => {
    event.target.value = null;
  };

  useEffect(() => {
    if (files.length > 0) {
      processFiles(files);
      clearFiles();
    }
  }, [clearFiles, files, processFiles]);

  return (
    <>
      <input
        data-testid="file-picker"
        style={{ display: "none" }}
        ref={setFileInput}
        accept={
          ["ios", "android"].some((p) => p === platform)
            ? "text/plain"
            : undefined
        }
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

function DesktopFilePicker({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const [isDragActive, setIsDragActive] = useState(false);
  const { openDesktopFile } = useFilePicker();

  useEffect(() => {
    const promise = Promise.all([
      listen("tauri://file-drop", (event) => {
        openDesktopFile(event.payload as string[]);
        setIsDragActive(false);
      }),
      listen("tauri://file-drop-hover", () => {
        setIsDragActive(true);
      }),
      listen("tauri://file-drop-cancelled", () => {
        setIsDragActive(false);
      }),
    ]);
    return () => {
      promise.then((listeners) => listeners.forEach((l) => l()));
    };
  }, [openDesktopFile]);

  return (
    <Root>
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
