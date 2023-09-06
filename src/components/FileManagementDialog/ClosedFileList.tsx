import { StartEllipsis } from "@/components/StartEllipsis";
import { readFile } from "@/native-api/filesystem";
import { useFilterStore } from "@/stores/filter-store";
import { addTodoFilePath } from "@/utils/settings";
import { useTask } from "@/utils/useTask";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Box,
  Dropdown,
  IconButton,
  List,
  ListItem,
  ListItemDecorator,
  ListSubheader,
  Menu,
  MenuButton,
  MenuItem,
} from "@mui/joy";
import { useTranslation } from "react-i18next";

interface ClosedFileListProps {
  list: string[];
  onOpen: () => void;
  onDelete: (filePath: string) => void;
}

interface FileListItemProps {
  filePath: string;
  onOpen: (filePath: string) => void;
  onDelete: (filePath: string) => void;
}

export function ClosedFileList(props: ClosedFileListProps) {
  const { list, onOpen, onDelete } = props;
  const { t } = useTranslation();
  const { loadTodoFile } = useTask();
  const setActiveTaskListPath = useFilterStore(
    (state) => state.setActiveTaskListPath,
  );

  const handleOpen = async (filePath: string) => {
    const data = await readFile(filePath);
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
    <List>
      <ListItem nested>
        <ListSubheader>{t("Closed files")}</ListSubheader>
        <List>
          {list.map((filePath) => (
            <FileListItem
              key={filePath}
              filePath={filePath}
              onOpen={handleOpen}
              onDelete={onDelete}
            />
          ))}
        </List>
      </ListItem>
    </List>
  );
}

function FileListItem(props: FileListItemProps) {
  return (
    <ListItem
      endAction={
        <FileLietItemMenu
          filePath={props.filePath}
          onOpen={props.onOpen}
          onDelete={props.onDelete}
        />
      }
    >
      <Box sx={{ overflow: "hidden" }}>
        <StartEllipsis variant="inherit">{props.filePath}</StartEllipsis>
      </Box>
    </ListItem>
  );
}

function FileLietItemMenu(props: FileListItemProps) {
  const { filePath, onOpen, onDelete } = props;
  const { t } = useTranslation();

  const handleOpen = () => {
    onOpen(filePath);
  };

  const handleDelete = () => {
    onDelete(filePath);
  };

  return (
    <Dropdown>
      <MenuButton
        aria-label="more"
        aria-haspopup="true"
        slots={{ root: IconButton }}
        slotProps={{ root: { variant: "plain", color: "neutral" } }}
      >
        <ArrowDropDown />
      </MenuButton>
      <Menu placement="bottom-end">
        <MenuItem onClick={handleOpen}>
          <ListItemDecorator>
            <OpenInNewOutlinedIcon />
          </ListItemDecorator>{" "}
          {t("Open")}
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemDecorator>
            <DeleteOutlineOutlinedIcon />
          </ListItemDecorator>{" "}
          {t("Delete")}
        </MenuItem>
      </Menu>
    </Dropdown>
  );
}
