import { Directory } from "@capacitor/filesystem";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { LoadingButton } from "@mui/lab";
import { styled } from "@mui/material";
import { useSnackbar } from "notistack";
import { ChangeEvent, PropsWithChildren, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { useFilesystem } from "../utils/filesystem";
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
    saveTodoFile,
    scheduleDueTaskNotifications,
    taskLists,
  } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const { addTodoFilePath } = useSettings();
  const platform = usePlatform();
  const id = generateId();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { isFile } = useFilesystem();
  const { setConfirmationDialog } = useConfirmationDialog();
  const [loading, setLoading] = useState(false);

  const openTodoFile = async (content: string, file: File) => {
    return new Promise<string | undefined>(async (resolve, reject) => {
      try {
        if (platform === "electron") {
          // Note: Electron adds a path property to the file object
          const filePath = (file as any).path;
          const taskList = await loadTodoFile(filePath, content);
          await addTodoFilePath(filePath);
          scheduleDueTaskNotifications(taskList);
          resolve(filePath);
        } else {
          // Other platforms does not allow to access the file storage. For this reason, a copy of
          // the selected file is created in the app's document directory.
          const fileName = file.name;

          const result = await isFile({
            directory: Directory.Documents,
            path: fileName,
          });

          if (result) {
            setConfirmationDialog({
              content: t(
                "todo.txt already exists. Do you want to replace it?",
                {
                  fileName,
                }
              ),
              buttons: [
                {
                  text: t("Cancel"),
                  handler: () => {
                    resolve(undefined);
                  },
                },
                {
                  text: t("Replace"),
                  handler: async () => {
                    await addTodoFilePath(fileName);
                    const taskList = await saveTodoFile(fileName, content);
                    scheduleDueTaskNotifications(taskList);
                    resolve(fileName);
                  },
                },
              ],
            });
          } else {
            await addTodoFilePath(fileName);
            const taskList = await saveTodoFile(fileName, content);
            scheduleDueTaskNotifications(taskList);
            resolve(fileName);
          }
        }
      } catch (e) {
        reject();
      }
    });
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
