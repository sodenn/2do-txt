import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import useFilterStore, { FilterType, SortKey } from "../stores/filter-store";
import useSettingsStore from "../stores/settings-store";
import { useAddShortcutListener } from "../utils/shortcuts";
import useTask from "../utils/useTask";
import ChipList from "./ChipList";
import Heading from "./Heading";

const Filter = () => {
  const { t } = useTranslation();
  const { taskLists, activeTaskList, ...rest } = useTask();
  const {
    sortBy,
    setSortBy,
    filterType,
    setFilterType,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
    togglePriority,
    resetActivePriorities,
    resetActiveProjects,
    toggleProject,
    resetActiveContexts,
    toggleContext,
    resetActiveTags,
    toggleTag,
    setHideCompletedTasks,
    setSearchTerm,
  } = useFilterStore();
  const taskView = useSettingsStore((state) => state.taskView);

  const attributes = activeTaskList ? activeTaskList : rest;

  const { priorities, projects, contexts, tags } = hideCompletedTasks
    ? attributes.incomplete
    : attributes;

  const showSortBy = taskLists.some((list) => list.items.length > 0);

  const shortcutListeners = useMemo(
    () => ({
      x: () => {
        resetActiveProjects();
        resetActiveContexts();
        resetActiveTags();
        resetActivePriorities();
        setSearchTerm("");
      },
    }),
    [
      resetActiveContexts,
      resetActivePriorities,
      resetActiveProjects,
      resetActiveTags,
      setSearchTerm,
    ]
  );

  useAddShortcutListener(shortcutListeners);

  return (
    <Stack spacing={2}>
      {Object.keys(priorities).length > 0 && (
        <Box>
          <Heading gutterBottom>{t("Priorities")}</Heading>
          <ChipList
            multiple={filterType === "OR"}
            items={priorities}
            activeItems={activePriorities}
            onClick={togglePriority}
            color="secondary"
          />
        </Box>
      )}
      {Object.keys(projects).length > 0 && (
        <Box>
          <Heading gutterBottom>{t("Projects")}</Heading>
          <ChipList
            items={projects}
            activeItems={activeProjects}
            onClick={toggleProject}
            color="info"
          />
        </Box>
      )}
      {Object.keys(contexts).length > 0 && (
        <Box>
          <Heading gutterBottom>{t("Contexts")}</Heading>
          <ChipList
            items={contexts}
            activeItems={activeContexts}
            onClick={toggleContext}
            color="success"
          />
        </Box>
      )}
      {Object.keys(tags).length > 0 && (
        <Box>
          <Heading gutterBottom>{t("Tags")}</Heading>
          <ChipList
            items={Object.keys(tags).reduce<Record<string, number>>(
              (acc, key) => {
                acc[key] = tags[key].length;
                return acc;
              },
              {}
            )}
            activeItems={activeTags}
            onClick={toggleTag}
            color="warning"
          />
        </Box>
      )}
      {showSortBy && (
        <Box>
          <Heading gutterBottom>{t("Filter type")}</Heading>
          <Select
            fullWidth
            size="small"
            defaultValue="strict"
            value={filterType}
            aria-label="Filter type"
            onChange={(event) =>
              setFilterType(event.target.value as FilterType)
            }
          >
            <MenuItem value="AND">{t("AND")}</MenuItem>
            <MenuItem value="OR">{t("OR")}</MenuItem>
          </Select>
        </Box>
      )}
      {showSortBy && (
        <Box>
          <Heading
            gutterBottom
            disabled={taskView === "timeline"}
            helperText={
              taskView === "timeline"
                ? t("Disabled when timeline view is active")
                : undefined
            }
          >
            {t("Sort by")}
          </Heading>
          <Select
            disabled={taskView === "timeline"}
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
        </Box>
      )}
      <Box>
        <Heading>{t("Status")}</Heading>
        <FormControlLabel
          control={
            <Checkbox
              checked={hideCompletedTasks}
              onChange={(event, checked) => setHideCompletedTasks(checked)}
            />
          }
          aria-label="Hide completed tasks"
          label={t("Hide completed tasks")}
        />
      </Box>
    </Stack>
  );
};

export default Filter;
