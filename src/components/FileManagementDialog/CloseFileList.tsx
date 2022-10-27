import { List, ListItem, ListItemButton, ListSubheader } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useFilter } from "../../data/FilterContext";
import { useSettings } from "../../data/SettingsContext";
import { useTask } from "../../data/TaskContext";
import { getFilesystem } from "../../utils/filesystem";
import StartEllipsis from "../StartEllipsis";
import CloseFileItemMenu from "./CloseFileItemMenu";

interface CloseFileListProps {
  list: string[];
  onOpen: () => void;
  onDelete: (filePath: string) => void;
}

const CloseFileList = (props: CloseFileListProps) => {
  const { list, onOpen, onDelete } = props;
  const { t } = useTranslation();
  const { readFile } = getFilesystem();
  const { loadTodoFile } = useTask();
  const { addTodoFilePath } = useSettings();
  const { setActiveTaskListPath } = useFilter();

  const handleOpen = async (filePath: string) => {
    const { data } = await readFile({
      path: filePath,
    });
    loadTodoFile(filePath, data).then(() => {
      setActiveTaskListPath(filePath);
      addTodoFilePath(filePath);
      onOpen();
    });
  };

  if (list.length === 0) {
    return null;
  }

  return (
    <List
      sx={{ py: 0 }}
      subheader={
        <ListSubheader sx={{ bgcolor: "inherit" }} component="div">
          {t("Closed files")}
        </ListSubheader>
      }
    >
      {list.map((filePath, idx) => (
        <ListItem
          key={idx}
          disablePadding
          secondaryAction={
            <CloseFileItemMenu
              filePath={filePath}
              onOpen={handleOpen}
              onDelete={onDelete}
            />
          }
        >
          <ListItemButton sx={{ pl: 3, overflow: "hidden" }} role={undefined}>
            <StartEllipsis variant="inherit">{filePath}</StartEllipsis>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default CloseFileList;
