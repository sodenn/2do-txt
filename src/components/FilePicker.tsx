import { Fade, Paper, styled, Typography } from "@mui/material";
import { listen } from "@tauri-apps/api/event";
import { useSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { useFilePicker } from "../data/FilePickerContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { WithChildren } from "../types/common.types";
import { getFilesystem } from "../utils/filesystem";
import { getPlatform } from "../utils/platform";

const Root = styled("div")({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  outline: "none",
});

const Overlay = styled("div")(({ theme }) => ({
  position: "fixed",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.modal + 1,
  padding: theme.spacing(2),
  background: theme.palette.background.default,
}));

const StyledPaper = styled(Paper)({
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const FilePicker = ({ children }: WithChildren) => {
  const platform = getPlatform();

  if (platform === "desktop") {
    return <DesktopFilePicker>{children}</DesktopFilePicker>;
  }

  return <WebFilePicker>{children}</WebFilePicker>;
};

const WebFilePicker = ({ children }: WithChildren) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { fileInputRef } = useFilePicker();
  const { setActiveTaskListPath } = useFilter();
  const { enqueueSnackbar } = useSnackbar();
  const { createNewTodoFile, taskLists } = useTask();
  const platform = getPlatform();

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

  const { onClick, onBlur, onKeyDown, onFocus, ...dropzoneProps } =
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
            enqueueSnackbar(t("The file could not be opened"), {
              variant: "error",
            });
          }
        );

        if (updateFilePath && filePath) {
          setActiveTaskListPath(filePath);
        }
      };

      fileReader.onerror = () => {
        enqueueSnackbar(t("The file could not be opened"), {
          variant: "error",
        });
      };

      fileReader.readAsText(file);
    },
    [
      createNewTodoFile,
      enqueueSnackbar,
      setActiveTaskListPath,
      taskLists.length,
      t,
    ]
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
        ref={fileInputRef}
        accept={
          ["ios", "android"].some((p) => p === platform)
            ? "text/plain"
            : undefined
        }
        type="file"
        onChange={handleChange}
        onClick={handleClick}
      />
      <Root data-testid="dropzone" {...dropzoneProps} data-shortcuts-ignore>
        <Fade in={isDragActive}>
          <Overlay>
            <StyledPaper>
              <Typography variant="h5" component="div">
                {t("Drop todo.txt file here")}
              </Typography>
            </StyledPaper>
          </Overlay>
        </Fade>
        {children}
      </Root>
    </>
  );
};

const DesktopFilePicker = ({ children }: WithChildren) => {
  const { t } = useTranslation();
  const [isDragActive, setIsDragActive] = useState(false);
  const { addTodoFilePath } = useSettings();
  const { loadTodoFile, scheduleDueTaskNotifications } = useTask();
  const { readFile } = getFilesystem();

  const processFiles = useCallback(
    async (paths?: string[]) => {
      if (!paths || paths.length === 0) {
        return;
      }
      const path = paths[0];
      const content = await readFile({ path });
      const taskList = await loadTodoFile(path, content.data);
      await addTodoFilePath(path);
      scheduleDueTaskNotifications(taskList.items);
    },
    [addTodoFilePath, loadTodoFile, readFile, scheduleDueTaskNotifications]
  );

  useEffect(() => {
    const promise = Promise.all([
      listen("tauri://file-drop", (event) => {
        processFiles(event.payload as string[]);
        setIsDragActive(false);
      }),
      listen("tauri://file-drop-hover", (event) => {
        setIsDragActive(true);
      }),
      listen("tauri://file-drop-cancelled", (event) => {
        setIsDragActive(false);
      }),
    ]);
    return () => {
      promise.then((listeners) => listeners.forEach((l) => l()));
    };
  }, [processFiles]);

  return (
    <Root data-testid="dropzone" data-shortcuts-ignore>
      <Fade in={isDragActive}>
        <Overlay>
          <StyledPaper>
            <Typography variant="h5" component="div">
              {t("Drop todo.txt file here")}
            </Typography>
          </StyledPaper>
        </Overlay>
      </Fade>
      {children}
    </Root>
  );
};

export default FilePicker;
