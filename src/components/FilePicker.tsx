import { Fade, Paper, styled, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { WithChildren } from "../types/common";
import { usePlatform } from "../utils/platform";

const Root = styled("div")(() => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
}));

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

const StyledPaper = styled(Paper)(() => ({
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

interface FileInputProps {
  files: File[];
  clearFiles: () => void;
}

const FileInput = (props: FileInputProps) => {
  const {
    fileInputRef,
    loadTodoFile,
    createNewTodoFile,
    scheduleDueTaskNotifications,
    taskLists,
  } = useTask();
  const { files, clearFiles } = props;
  const { setActiveTaskListPath } = useFilter();
  const { addTodoFilePath } = useSettings();
  const platform = usePlatform();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const openTodoFile = useCallback(
    async (content: string, file: File) => {
      if (platform === "electron") {
        // Note: Electron adds a path property to the file object
        const filePath = (file as any).path;
        const taskList = await loadTodoFile(filePath, content);
        await addTodoFilePath(filePath);
        scheduleDueTaskNotifications(taskList.items);
        return filePath;
      } else {
        // Other platforms does not allow to access the file storage.
        // -> create a copy of the selected file in the app's document directory
        return createNewTodoFile(file.name, content);
      }
    },
    [
      addTodoFilePath,
      createNewTodoFile,
      loadTodoFile,
      platform,
      scheduleDueTaskNotifications,
    ]
  );

  const processFiles = useCallback(
    (files: File[]) => {
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

        const filePath = await openTodoFile(content, file).catch(() => {
          enqueueSnackbar(t("The file could not be opened"), {
            variant: "error",
          });
        });

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
    [enqueueSnackbar, openTodoFile, setActiveTaskListPath, t, taskLists.length]
  );

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(event.target.files as any);
    }
  };

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
    <input
      data-testid="file-picker"
      style={{ display: "none" }}
      ref={fileInputRef}
      accept="text/plain"
      type="file"
      onChange={handleChange}
      onClick={handleClick}
    />
  );
};

const FilePicker = ({ children }: WithChildren) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 1 && acceptedFiles[0].type === "text/plain") {
      setFile(acceptedFiles);
    }
  }, []);

  const clearFiles = useCallback(() => setFile([]), []);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <Root data-testid="dropzone" {...getRootProps()}>
      <FileInput files={file} clearFiles={clearFiles} />
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
