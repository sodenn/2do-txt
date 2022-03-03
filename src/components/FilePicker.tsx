import { styled } from "@mui/material";
import { useSnackbar } from "notistack";
import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { usePlatform } from "../utils/platform";

const Input = styled("input")({
  display: "none",
});

const FilePicker = () => {
  const {
    fileInputRef,
    loadTodoFile,
    createNewTodoFile,
    scheduleDueTaskNotifications,
    taskLists,
  } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const { addTodoFilePath } = useSettings();
  const platform = usePlatform();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const openTodoFile = async (content: string, file: File) => {
    if (platform === "electron") {
      // Note: Electron adds a path property to the file object
      const filePath = (file as any).path;
      const taskList = await loadTodoFile(filePath, content);
      await addTodoFilePath(filePath);
      scheduleDueTaskNotifications(taskList);
      return filePath;
    } else {
      // Other platforms does not allow to access the file storage.
      // -> create a copy of the selected file in the app's document directory
      return createNewTodoFile(file.name, content);
    }
  };

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

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
  };

  const handleClick = (event: any) => {
    event.target.value = null;
  };

  return (
    <Input
      ref={fileInputRef}
      accept="text/plain"
      type="file"
      onChange={handleChange}
      onClick={handleClick}
    />
  );
};

export default FilePicker;
