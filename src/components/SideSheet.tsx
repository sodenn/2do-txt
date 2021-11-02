import { TabContext, TabPanel } from "@mui/lab";
import {
  Box,
  Paper,
  styled,
  SwipeableDrawer,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../data/AppContext";
import { useTask } from "../data/TaskContext";
import Filter from "./Filter";
import Settings from "./Settings";

const StyledPaper = styled(Paper)`
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 340px;
`;

const SaveAreaHeader = styled("div")`
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
`;

const SaveAreaContent = styled("div")`
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
`;

const SideSheet = () => {
  const { t } = useTranslation();
  const { sideSheetOpen, setSideSheetOpen } = useAppContext();
  const { priorities, projects, contexts, fields, taskList } = useTask();
  const [tab, setTab] = React.useState<string>("filter");

  const hideFilter =
    taskList.filter((t) => t.completed).length === 0 &&
    Object.keys(priorities).length === 0 &&
    Object.keys(projects).length === 0 &&
    Object.keys(contexts).length === 0 &&
    Object.keys(fields).length === 0;

  const handleChange = (event: any, newValue: string) => {
    setTab(newValue);
  };

  return (
    <SwipeableDrawer
      aria-label="Menu"
      anchor="left"
      open={sideSheetOpen}
      onOpen={() => setSideSheetOpen(true)}
      onClose={() => setSideSheetOpen(false)}
    >
      <StyledPaper elevation={0} square>
        {hideFilter && (
          <>
            <Box
              sx={{
                px: 2,
                py: 1,
                flex: "none",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <SaveAreaHeader>
                <Typography variant="h6" component="div">
                  {t("Settings")}
                </Typography>
              </SaveAreaHeader>
            </Box>
            <Box sx={{ p: 2, overflowY: "auto", flex: "auto" }}>
              <SaveAreaContent>
                <Settings />
              </SaveAreaContent>
            </Box>
          </>
        )}
        {!hideFilter && (
          <TabContext value={tab}>
            <Box sx={{ flex: "none", borderBottom: 1, borderColor: "divider" }}>
              <SaveAreaHeader>
                <Tabs value={tab} onChange={handleChange}>
                  <Tab label={t("Filter")} value="filter" />
                  <Tab label={t("Settings")} value="settings" />
                </Tabs>
              </SaveAreaHeader>
            </Box>
            <Box sx={{ overflowY: "auto", flex: "auto" }}>
              <SaveAreaContent>
                <TabPanel value="filter">
                  <Filter />
                </TabPanel>
                <TabPanel value="settings">
                  <Settings />
                </TabPanel>
              </SaveAreaContent>
            </Box>
          </TabContext>
        )}
      </StyledPaper>
    </SwipeableDrawer>
  );
};

export default SideSheet;
