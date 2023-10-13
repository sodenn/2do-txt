import { ChipList } from "@/components/ChipList";
import { FilterType, SortKey, useFilterStore } from "@/stores/filter-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useHotkeys } from "@/utils/useHotkeys";
import { useTask } from "@/utils/useTask";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Checkbox,
  FormControl,
  FormLabel,
  Link,
  Option,
  Select,
  Stack,
  Tooltip,
} from "@mui/joy";
import { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";

export function Filter() {
  const { t } = useTranslation();
  const { taskLists, activeTaskList, ...rest } = useTask();
  const {
    sortBy,
    searchTerm,
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
  const defaultFilter = useMemo(
    () =>
      searchTerm === "" &&
      activeContexts.length === 0 &&
      activeProjects.length === 0 &&
      activeTags.length === 0 &&
      activePriorities.length === 0,
    [activeContexts, activePriorities, activeProjects, activeTags, searchTerm],
  );

  const resetFilters = useCallback(() => {
    resetActiveProjects();
    resetActiveContexts();
    resetActiveTags();
    resetActivePriorities();
    setSearchTerm("");
  }, [
    resetActiveContexts,
    resetActivePriorities,
    resetActiveProjects,
    resetActiveTags,
    setSearchTerm,
  ]);

  const hotkeys = useMemo(
    () => ({
      x: resetFilters,
    }),
    [resetFilters],
  );

  useHotkeys(hotkeys);

  return (
    <Stack spacing={2}>
      {Object.keys(priorities).length > 0 && (
        <FormControl>
          <FormLabel component="div">{t("Priorities")}</FormLabel>
          <ChipList
            items={priorities}
            activeItems={activePriorities}
            onClick={togglePriority}
            color="priority"
          />
        </FormControl>
      )}
      {Object.keys(projects).length > 0 && (
        <FormControl>
          <FormLabel component="div">{t("Projects")}</FormLabel>
          <ChipList
            items={projects}
            activeItems={activeProjects}
            onClick={toggleProject}
            color="primary"
          />
        </FormControl>
      )}
      {Object.keys(contexts).length > 0 && (
        <FormControl>
          <FormLabel component="div">{t("Contexts")}</FormLabel>
          <ChipList
            items={contexts}
            activeItems={activeContexts}
            onClick={toggleContext}
            color="success"
          />
        </FormControl>
      )}
      {Object.keys(tags).length > 0 && (
        <FormControl>
          <FormLabel component="div">{t("Tags")}</FormLabel>
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
        </FormControl>
      )}
      {!defaultFilter && (
        <Stack alignItems="flex-end">
          <Link fontSize="small" onClick={resetFilters}>
            {t("Reset filters")}
          </Link>
        </Stack>
      )}
      {showSortBy && (
        <FormControl>
          <FormLabel>{t("Filter type")}</FormLabel>
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
        </FormControl>
      )}
      {showSortBy && (
        <FormControl disabled={taskView === "timeline"}>
          <FormLabel>
            {t("Sort by")}{" "}
            {taskView === "timeline" && (
              <Tooltip
                disableTouchListener={false}
                enterTouchDelay={0}
                leaveTouchDelay={2000}
                title={
                  <Trans i18nKey="Disabled when timeline view is active" />
                }
              >
                <HelpOutlineIcon fontSize="small" />
              </Tooltip>
            )}
          </FormLabel>
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
        </FormControl>
      )}
      <FormControl>
        <FormLabel>{t("Status")}</FormLabel>
        <Checkbox
          checked={hideCompletedTasks}
          onChange={(event) => setHideCompletedTasks(event.target.checked)}
          label={t("Hide completed tasks")}
          slotProps={{
            input: {
              "aria-label": "Hide completed tasks",
            },
          }}
        />
      </FormControl>
    </Stack>
  );
}
