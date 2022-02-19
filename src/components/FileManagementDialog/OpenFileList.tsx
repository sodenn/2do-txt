import { List, ListSubheader } from "@mui/material";
import React, { memo } from "react";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { useTranslation } from "react-i18next";
import { useTask } from "../../data/TaskContext";
import OpenFileItem, { CloseOptions } from "./OpenFileItem";

interface OpenFileListProps {
  subheader: boolean;
  onClick: (filePath: string) => void;
  onClose: (options: CloseOptions) => void;
}

const OpenFileList = memo((props: OpenFileListProps) => {
  const { subheader, onClick, onClose } = props;
  const { taskLists, reorderTaskList } = useTask();
  const { t } = useTranslation();

  if (taskLists.length === 0) {
    return null;
  }

  const handleDragEnd = ({ destination, source }: DropResult) => {
    if (destination) {
      const startIndex = source.index;
      const endIndex = destination.index;
      const filePaths = taskLists.map((t) => t.filePath);
      const [removed] = filePaths.splice(startIndex, 1);
      filePaths.splice(endIndex, 0, removed);
      reorderTaskList(filePaths);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="droppable-list">
        {(provided) => (
          <List
            sx={{ py: 0 }}
            subheader={
              subheader ? (
                <ListSubheader sx={{ bgcolor: "inherit" }} component="div">
                  {t("Open files")}
                </ListSubheader>
              ) : undefined
            }
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {taskLists.map((item, index) => (
              <OpenFileItem
                filePath={item.filePath}
                index={index}
                key={item.filePath}
                onClick={onClick}
                onClose={onClose}
              />
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
});

export default OpenFileList;
