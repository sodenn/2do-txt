import { CloseOutlined } from "@mui/icons-material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  Accordion,
  AccordionSummary,
  Box,
  Checkbox,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { SortKey, useAppContext } from "../data/AppContext";
import { useTask } from "../data/TaskContext";
import { Dictionary } from "../utils/types";
import ChipList from "./ChipList";
import Settings from "./Settings";

const SideSheet = () => {
  const { t } = useTranslation();
  const {
    sortBy,
    setSortBy,
    sideSheetOpen,
    setSideSheetOpen,
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
  const { priorities, projects, contexts, fields, taskList } = useTask();

  const hideSettings =
    (taskList.filter((t) => t.completed).length > 0 &&
      taskList.filter((t) => !t.completed).length > 0) ||
    Object.keys(priorities).length > 0 ||
    Object.keys(projects).length > 0 ||
    Object.keys(contexts).length > 0 ||
    Object.keys(fields).length > 0 ||
    (taskList.filter((t) => t.completed).length > 0 &&
      taskList.filter((t) => !t.completed).length > 0);

  return (
    <Drawer
      aria-label="Menu"
      anchor="left"
      open={sideSheetOpen}
      onClose={() => setSideSheetOpen(false)}
    >
      <Paper
        elevation={0}
        square
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          width: 350,
        }}
      >
        <Box sx={{ flex: "none" }}>
          <Box sx={{ px: 3, py: 1 }}>
            <IconButton
              color="inherit"
              size="large"
              edge="start"
              onClick={() => setSideSheetOpen(false)}
            >
              <CloseOutlined />
            </IconButton>
          </Box>
          <Divider />
        </Box>
        <Box sx={{ p: 2, overflowY: "auto", flex: "auto" }}>
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
                <Typography component="div" variant="subtitle1" gutterBottom>
                  {t("Status")}
                </Typography>
                <FormControlLabel
                  sx={{ mb: 2 }}
                  control={
                    <Checkbox
                      checked={hideCompletedTasks}
                      onChange={(event, checked) =>
                        setHideCompletedTasks(checked)
                      }
                    />
                  }
                  label={t("Hide completed tasks")}
                />
              </>
            )}
          {taskList.length > 0 && (
            <>
              <Typography component="div" variant="subtitle1" gutterBottom>
                {t("Sort by")}
              </Typography>
              <RadioGroup
                aria-label="sortby"
                defaultValue=""
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortKey)}
              >
                <FormControlLabel
                  value="priority"
                  control={<Radio />}
                  label={t("Priority")}
                />
                <FormControlLabel
                  value="dueDate"
                  control={<Radio />}
                  label={t("Due Date")}
                />
                <FormControlLabel
                  value=""
                  control={<Radio />}
                  label={t("No sorting")}
                />
              </RadioGroup>
            </>
          )}
          {!hideSettings && <Settings />}
        </Box>
        {hideSettings && (
          <Box sx={{ flex: "none" }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandLessIcon />}>
                {t("Settings")}
              </AccordionSummary>
              <Box sx={{ p: 2 }}>
                <Settings />
              </Box>
            </Accordion>
          </Box>
        )}
      </Paper>
    </Drawer>
  );
};

export default SideSheet;
