import { List, ListSubheader } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { arrayMove, List as MovableList } from "react-movable";
import { OnChangeMeta } from "react-movable/lib/types";
import { useTask } from "../../data/TaskContext";
import OpenFileItem, { CloseOptions } from "./OpenFileItem";

interface OpenFileListProps {
  subheader: boolean;
  onClose: (options: CloseOptions) => void;
}

const OpenFileList = memo((props: OpenFileListProps) => {
  const { subheader, onClose } = props;
  const wrapper = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const { taskLists, reorderTaskList } = useTask();
  const [items, setItems] = useState(taskLists.map((t) => t.filePath));
  const { t } = useTranslation();

  useEffect(() => {
    setContainer(wrapper.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapper.current]);

  useEffect(() => {
    setItems(taskLists.map((t) => t.filePath));
  }, [taskLists]);

  if (items.length === 0) {
    return null;
  }

  const handleChange = ({ oldIndex, newIndex }: OnChangeMeta) => {
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    reorderTaskList(newItems);
  };

  return (
    <div ref={wrapper}>
      <MovableList
        lockVertically
        values={items}
        container={container}
        renderList={({ children, props }) => (
          <List
            sx={{ py: 0 }}
            subheader={
              subheader ? (
                <ListSubheader sx={{ bgcolor: "inherit" }} component="div">
                  {t("Open files")}
                </ListSubheader>
              ) : undefined
            }
            {...props}
          >
            {children}
          </List>
        )}
        renderItem={({ value, props }) => (
          <OpenFileItem filePath={value} onClose={onClose} {...props} />
        )}
        onChange={handleChange}
      />
    </div>
  );
});

export default OpenFileList;
