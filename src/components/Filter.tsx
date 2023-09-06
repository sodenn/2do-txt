import { ChipList } from "@/components/ChipList";
import { Heading } from "@/components/Heading";
import { FilterType, SortKey, useFilterStore } from "@/stores/filter-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useHotkeys } from "@/utils/useHotkeys";
import { useTask } from "@/utils/useTask";
import { Box, Checkbox, Option, Select, Stack } from "@mui/joy";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function Filter() {
  const { t } = useTranslation();
  const { taskLists, activeTaskList, ...rest } = useTask();
  const {
    sortBy,
    filterType,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
    setSortBy,
    setFilterType,
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
  const hotkeys = useMemo(
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
    ],
  );

  useHotkeys(hotkeys);

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
            color="neutral"
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
            color="primary"
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
              {},
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
            defaultValue="strict"
            value={filterType}
            onChange={(_, value) => setFilterType(value as FilterType)}
            slotProps={{
              button: {
                "aria-label": "Filter type",
              },
            }}
          >
            <Option value="AND">{t("AND")}</Option>
            <Option value="OR">{t("OR")}</Option>
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
            defaultValue=""
            value={sortBy}
            onChange={(_, value) => setSortBy(value as SortKey)}
            slotProps={{
              button: {
                "aria-label": "Sort tasks",
              },
            }}
          >
            <Option value="">{t("No sorting")}</Option>
            <Option value="priority">{t("Priority")}</Option>
            <Option value="dueDate">{t("Due Date")}</Option>
            <Option value="context">{t("Context")}</Option>
            <Option value="project">{t("Project")}</Option>
            <Option value="tag">{t("Tag")}</Option>
          </Select>
        </Box>
      )}
      <Box>
        <Heading>{t("Status")}</Heading>
        <Checkbox
          sx={{ mt: 1 }}
          checked={hideCompletedTasks}
          onChange={(event) => setHideCompletedTasks(event.target.checked)}
          label={t("Hide completed tasks")}
          aria-label="Hide completed tasks"
        />
      </Box>
    </Stack>
  );
}
