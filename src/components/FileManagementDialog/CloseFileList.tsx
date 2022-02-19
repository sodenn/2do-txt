import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  IconButton,
  List,
  ListItem,
  ListSubheader,
  Tooltip,
} from "@mui/material";
import { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import StartEllipsis from "../StartEllipsis";

interface CloseFileListProps {
  list: string[];
  onClick: (filePath: string) => void;
  onOpen: (event: MouseEvent<HTMLButtonElement>, filePath: string) => void;
  onDelete: (event: MouseEvent<HTMLButtonElement>, filePath: string) => void;
}

const CloseFileList = (props: CloseFileListProps) => {
  const { list, onClick, onOpen, onDelete } = props;
  const { t } = useTranslation();

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
          button
          sx={{ pr: 12 }}
          onClick={() => onClick(filePath)}
          secondaryAction={
            <>
              <Tooltip title={t("Open") as string}>
                <IconButton
                  aria-label="Open file"
                  onClick={(event) => onOpen(event, filePath)}
                >
                  <OpenInNewOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("Delete") as string}>
                <IconButton
                  edge="end"
                  aria-label="Delete file"
                  onClick={(event) => onDelete(event, filePath)}
                >
                  <DeleteOutlineOutlinedIcon />
                </IconButton>
              </Tooltip>
            </>
          }
        >
          <StartEllipsis sx={{ my: 0.5 }} variant="inherit">
            {filePath}
          </StartEllipsis>
        </ListItem>
      ))}
    </List>
  );
};

export default CloseFileList;
