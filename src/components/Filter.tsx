import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { FilterType, SortKey, useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { useAddShortcutListener } from "../utils/shortcuts";
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
    setActivePriorities,
    setActiveProjects,
    setActiveContexts,
    setActiveTags,
    setHideCompletedTasks,
    setSearchTerm,
  } = useFilter();
  const { taskView } = useSettings();

  const attributes = activeTaskList ? activeTaskList : rest;

  const { priorities, projects, contexts, tags } = hideCompletedTasks
    ? attributes.incomplete
    : attributes;

  const showSortBy = taskLists.some((list) => list.items.length > 0);

  useAddShortcutListener(() => {
    setActiveProjects([]);
    setActiveContexts([]);
    setActiveTags([]);
    setActivePriorities([]);
    setSearchTerm("");
  }, "x");

  return (
    <Stack spacing={2}>
      {Object.keys(priorities).length > 0 && (
        <Box>
          <Heading gutterBottom>{t("Priorities")}</Heading>
          <ChipList
            multiple={filterType === "OR"}
            items={priorities}
            activeItems={activePriorities}
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
      )}
      {Object.keys(projects).length > 0 && (
        <Box>
          <Heading gutterBottom>{t("Projects")}</Heading>
          <ChipList
            items={projects}
            activeItems={activeProjects}
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
      )}
      {Object.keys(contexts).length > 0 && (
        <Box>
          <Heading gutterBottom>{t("Contexts")}</Heading>
          <ChipList
            items={contexts}
            activeItems={activeContexts}
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
          label={t("Hide completed tasks") as string}
        />
      </Box>
    </Stack>
  );
};

export default Filter;
