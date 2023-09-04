import { StartEllipsis } from "@/components/StartEllipsis";
import { readFile } from "@/native-api/filesystem";
import { useFilterStore } from "@/stores/filter-store";
import { addTodoFilePath } from "@/utils/settings";
import { useTask } from "@/utils/useTask";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Dropdown,
  List,
  ListItem,
  ListItemButton,
  ListItemDecorator,
  ListSubheader,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import { useTranslation } from "react-i18next";

interface ClosedFileListProps {
  list: string[];
  onOpen: () => void;
  onDelete: (filePath: string) => void;
}

interface FileProps {
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
            <File
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

function File(props: FileProps) {
  return (
    <ListItem
      endAction={
        <FileMenu
          filePath={props.filePath}
          onOpen={props.onOpen}
          onDelete={props.onDelete}
        />
      }
    >
      <ListItemButton>
        <StartEllipsis variant="inherit">{props.filePath}</StartEllipsis>
      </ListItemButton>
    </ListItem>
  );
}

function FileMenu(props: FileProps) {
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
      <MenuButton aria-label="more" aria-haspopup="true">
        <ArrowDropDown />
      </MenuButton>
      <Menu placement="bottom-end">
        <MenuItem onClick={handleOpen}>
          <ListItemDecorator>
            <OpenInNewOutlinedIcon />
          </ListItemDecorator>
          <Typography>{t("Open")}</Typography>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemDecorator>
            <DeleteOutlineOutlinedIcon />
          </ListItemDecorator>
          <Typography>{t("Delete")}</Typography>
        </MenuItem>
      </Menu>
    </Dropdown>
  );
}
