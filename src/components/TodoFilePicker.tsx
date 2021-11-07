import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { LoadingButton } from "@mui/lab";
import { styled } from "@mui/material";
import { useSnackbar } from "notistack";
import React, { ChangeEvent, PropsWithChildren, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { usePlatform } from "../utils/platform";
import { Task } from "../utils/task";
import { generateId } from "../utils/uuid";

const Input = styled("input")({
  display: "none",
});

interface FilePickerProps {
  onSelect?: () => void;
}

const TodoFilePicker = ({
  onSelect,
  children,
}: PropsWithChildren<FilePickerProps>) => {
  const { loadTodoFile, saveTodoFile, scheduleDueTaskNotifications } =
    useTask();
  const platform = usePlatform();
  const id = generateId();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const readFileContent = async (content: string, file: File) => {
    let taskList: Task[];
    // Note: Electron adds a path property to the file object
    if (platform === "electron") {
      // Load the content and save the path so that the file can be loaded the next time the app is opened.
      taskList = await loadTodoFile(content, (file as any).path);
    } else {
      // Other platforms does not allow to accessing the file storage. For this reason, a copy of
      // the selected file is created in the app's document directory.
      taskList = await saveTodoFile(content);
    }
    scheduleDueTaskNotifications(taskList);
  };

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    setLoading(true);

    const file = event.target.files[0];
    const fileReader = new FileReader();

    fileReader.onloadend = async () => {
      const content = fileReader.result;

      if (typeof content !== "string") {
        return;
      }

      await readFileContent(content, file).catch(() => {
        enqueueSnackbar(t("The file could not be opened"), {
          variant: "error",
        });
        setLoading(false);
      });

      if (onSelect) {
        onSelect();
      }
    };

    fileReader.onerror = () => {
      enqueueSnackbar(t("The file could not be opened"), {
        variant: "error",
      });
      setLoading(false);
    };

    fileReader.onabort = () => {
      setLoading(false);
    };

    fileReader.readAsText(file);
  };

  return (
    <label style={{ width: "100%" }} htmlFor={id}>
      <Input accept="text/plain" id={id} type="file" onChange={handleChange} />
      <LoadingButton
        loading={loading}
        startIcon={<FolderOpenIcon />}
        fullWidth
        variant="outlined"
        component="span"
      >
        {children}
      </LoadingButton>
    </label>
  );
};

export default TodoFilePicker;
