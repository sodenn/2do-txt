import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { SortKey, useAppContext } from "../data/AppContext";
import { useTask } from "../data/TaskContext";
import { Dictionary } from "../utils/types";
import ChipList from "./ChipList";

const Filter = () => {
  const { t } = useTranslation();
  const { priorities, projects, contexts, fields, taskList } = useTask();
  const {
    sortBy,
    setSortBy,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedFields,
    hideCompletedTasks,
    setSelectedPriorities,
    setSelectedProjects,
    setSelectedContexts,
    setSelectedFields,
    setHideCompletedTasks,
  } = useAppContext();

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
              selected={selectedPriorities}
              onClick={(item) =>
                setSelectedPriorities((items) =>
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
              selected={selectedProjects}
              onClick={(item) =>
                setSelectedProjects((items) =>
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
              selected={selectedContexts}
              onClick={(item) =>
                setSelectedContexts((items) =>
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
      {Object.keys(fields).length > 0 && (
        <>
          <Typography component="div" variant="subtitle1" gutterBottom>
            {t("Fields")}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <ChipList
              list={Object.keys(fields).reduce<Dictionary<number>>(
                (acc, key) => {
                  acc[key] = fields[key].length;
                  return acc;
                },
                {}
              )}
              selected={selectedFields}
              onClick={(item) =>
                setSelectedFields((items) =>
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
      {taskList.filter((t) => t.completed).length > 0 &&
        taskList.filter((t) => !t.completed).length > 0 && (
          <>
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
              label={t("Hide completed tasks") as string}
            />
          </>
        )}
      {taskList.length > 0 && (
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
            onChange={(event) => setSortBy(event.target.value as SortKey)}
          >
            <MenuItem value="priority">{t("Priority")}</MenuItem>
            <MenuItem value="dueDate">{t("Due Date")}</MenuItem>
            <MenuItem value="context">{t("Context")}</MenuItem>
            <MenuItem value="project">{t("Project")}</MenuItem>
            <MenuItem value="tag">{t("Tag")}</MenuItem>
            <MenuItem value="">{t("No sorting")}</MenuItem>
          </Select>
        </>
      )}
    </>
  );
};

export default Filter;
