import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { LoadingButton } from "@mui/lab";
import { styled } from "@mui/material";
import { useSnackbar } from "notistack";
import { ChangeEvent, PropsWithChildren, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { usePlatform } from "../utils/platform";
import { generateId } from "../utils/uuid";

const Input = styled("input")({
  display: "none",
});

interface FilePickerProps {
  component?: ReactNode;
}

const FilePicker = (props: PropsWithChildren<FilePickerProps>) => {
  const { component, children } = props;

  const {
    loadTodoFile,
    createNewTodoFile,
    scheduleDueTaskNotifications,
    taskLists,
  } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const { addTodoFilePath } = useSettings();
  const platform = usePlatform();
  const id = generateId();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const openTodoFile = async (content: string, file: File) => {
    if (platform === "electron") {
      // Note: Electron adds a path property to the file object
      const filePath = (file as any).path;
      const taskList = await loadTodoFile(filePath, content);
      await addTodoFilePath(filePath);
      scheduleDueTaskNotifications(taskList);
      return filePath;
    } else {
      // Other platforms does not allow to access the file storage. For this reason, a copy of
      // the selected file is created in the app's document directory.
      return createNewTodoFile(file.name, content);
    }
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
      });

      setLoading(false);

      if (updateFilePath && filePath) {
        setActiveTaskListPath(filePath);
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

  const handleClick = (event: any) => {
    event.target.value = null;
  };

  return (
    <label style={{ width: "100%" }} htmlFor={id}>
      <Input
        accept="text/plain"
        id={id}
        type="file"
        onChange={handleChange}
        onClick={handleClick}
      />
      {!!component && component}
      {!component && (
        <LoadingButton
          aria-label="Open todo.txt"
          disabled={loading}
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

export default FilePicker;
