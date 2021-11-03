import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Button, styled } from "@mui/material";
import React, { ChangeEvent, PropsWithChildren } from "react";
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

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const fileReader = new FileReader();
      fileReader.onloadend = async () => {
        const content = fileReader.result;

        if (typeof content !== "string") {
          return;
        }

        let taskList: Task[];
        if (platform === "electron") {
          // Note: Electron adds a path property to the file object
          taskList = await loadTodoFile(content, (file as any).path);
        } else {
          taskList = await saveTodoFile(content);
        }
        scheduleDueTaskNotifications(taskList);

        if (onSelect) {
          onSelect();
        }
      };
      fileReader.readAsText(file);
    }
  };

  return (
    <label style={{ width: "100%" }} htmlFor={id}>
      <Input accept="text/plain" id={id} type="file" onChange={handleChange} />
      <Button
        startIcon={<FolderOpenIcon />}
        fullWidth
        variant="outlined"
        component="span"
      >
        {children}
      </Button>
    </label>
  );
};

export default TodoFilePicker;
