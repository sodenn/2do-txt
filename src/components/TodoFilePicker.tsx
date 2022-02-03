import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { LoadingButton } from "@mui/lab";
import { styled } from "@mui/material";
import { useSnackbar } from "notistack";
import { ChangeEvent, PropsWithChildren, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import { useFilesystem } from "../utils/filesystem";
import { usePlatform } from "../utils/platform";
import { Task } from "../utils/task";
import { generateId } from "../utils/uuid";

const Input = styled("input")({
  display: "none",
});

interface FilePickerProps {
  onSelect?: () => void;
  component?: ReactNode;
}

const TodoFilePicker = (props: PropsWithChildren<FilePickerProps>) => {
  const { onSelect, component, children } = props;

  const {
    loadTodoFile,
    saveTodoFile,
    scheduleDueTaskNotifications,
    taskLists,
  } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const platform = usePlatform();
  const id = generateId();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { getUniqueFilePath } = useFilesystem();
  const [loading, setLoading] = useState(false);

  const openTodoFile = async (content: string, file: File) => {
    let taskList: Task[];
    let filePath: string;

    if (platform === "electron") {
      // Note: Electron adds a path property to the file object
      filePath = (file as any).path;
      taskList = await loadTodoFile(filePath, content);
    } else {
      // Other platforms does not allow to access the file storage. For this reason, a copy of
      // the selected file is created in the app's document directory.
      const uniqueFilePath = await getUniqueFilePath(file.name);
      filePath = uniqueFilePath.fileName;
      taskList = await saveTodoFile(filePath, content);
    }

    scheduleDueTaskNotifications(taskList);
    return filePath;
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

      const updateFilePath = taskLists.length > 0;

      const filePath = await openTodoFile(content, file).catch(() => {
        enqueueSnackbar(t("The file could not be opened"), {
          variant: "error",
        });
        setLoading(false);
      });

      setLoading(false);

      if (updateFilePath && filePath) {
        setActiveTaskListPath(filePath);
      }

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
      {!!component && component}
      {!component && (
        <LoadingButton
          aria-label="Open todo.txt"
          loading={loading}
          startIcon={<FolderOpenOutlinedIcon />}
          fullWidth
          variant="outlined"
          component="span"
        >
          {children}
        </LoadingButton>
      )}
    </label>
  );
};

export default TodoFilePicker;
