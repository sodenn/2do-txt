import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { SortKey, useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import { Dictionary } from "../types/common";
import ChipList from "./ChipList";

const Filter = () => {
  const { t } = useTranslation();
  const { taskLists, activeTaskList, ...rest } = useTask();
  const {
    sortBy,
    setSortBy,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
    setActivePriorities,
    setActiveProjects,
    setActiveContexts,
    setActiveTags,
    setHideCompletedTasks,
  } = useFilter();

  const attributes = activeTaskList ? activeTaskList : rest;

  const { priorities, projects, contexts, tags } = hideCompletedTasks
    ? attributes.incomplete
    : attributes;

  const showSortBy = taskLists.some((list) => list.items.length > 0);

  return (
    <>
      {Object.keys(priorities).length > 0 && (
        <>
          <Typography component="div" variant="subtitle1" gutterBottom>
            {t("Priorities")}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <ChipList
              list={priorities}
              active={activePriorities}
              onClick={(item) =>
                setActivePriorities((items) =>
                  items.includes(item)
                    ? items.filter((i) => i !== item)
                    : [...items, item]
                )
              }
              color="secondary"
            />
          </Box>
        </>
      )}
      {Object.keys(projects).length > 0 && (
        <>
          <Typography component="div" variant="subtitle1" gutterBottom>
            {t("Projects")}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <ChipList
              list={projects}
              active={activeProjects}
              onClick={(item) =>
                setActiveProjects((items) =>
                  items.includes(item)
                    ? items.filter((i) => i !== item)
                    : [...items, item]
                )
              }
              color="info"
            />
          </Box>
        </>
      )}
      {Object.keys(contexts).length > 0 && (
        <>
          <Typography component="div" variant="subtitle1" gutterBottom>
            {t("Contexts")}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <ChipList
              list={contexts}
              active={activeContexts}
              onClick={(item) =>
                setActiveContexts((items) =>
                  items.includes(item)
                    ? items.filter((i) => i !== item)
                    : [...items, item]
                )
              }
              color="success"
            />
          </Box>
        </>
      )}
      {Object.keys(tags).length > 0 && (
        <>
          <Typography component="div" variant="subtitle1" gutterBottom>
            {t("Tags")}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <ChipList
              list={Object.keys(tags).reduce<Dictionary<number>>((acc, key) => {
                acc[key] = tags[key].length;
                return acc;
              }, {})}
              active={activeTags}
              onClick={(item) =>
                setActiveTags((items) =>
                  items.includes(item)
                    ? items.filter((i) => i !== item)
                    : [...items, item]
                )
              }
              color="warning"
            />
          </Box>
        </>
      )}
      <Typography component="div" variant="subtitle1">
        {t("Status")}
      </Typography>
      <FormControlLabel
        sx={{ mb: 2 }}
        control={
          <Checkbox
            checked={hideCompletedTasks}
            onChange={(event, checked) => setHideCompletedTasks(checked)}
          />
        }
        aria-label="Hide completed tasks"
        label={t("Hide completed tasks") as string}
      />
      {showSortBy && (
        <>
          <Typography component="div" variant="subtitle1" gutterBottom>
            {t("Sort by")}
          </Typography>
          <Select
            fullWidth
            size="small"
            defaultValue=""
            displayEmpty
            value={sortBy}
            aria-label="Sort tasks"
            onChange={(event) => setSortBy(event.target.value as SortKey)}
          >
            <MenuItem value="">{t("No sorting")}</MenuItem>
            <MenuItem value="priority">{t("Priority")}</MenuItem>
            <MenuItem value="dueDate">{t("Due Date")}</MenuItem>
            <MenuItem value="context">{t("Context")}</MenuItem>
            <MenuItem value="project">{t("Project")}</MenuItem>
            <MenuItem value="tag">{t("Tag")}</MenuItem>
          </Select>
        </>
      )}
    </>
  );
};

export default Filter;
