import { TabContext, TabPanel } from "@mui/lab";
import { Box, Paper, styled, SwipeableDrawer, Tab, Tabs } from "@mui/material";
import React, { useEffect } from "react";
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
  const { priorities, projects, contexts, fields, taskList, tasksLoaded } =
    useTask();

  const hideFilter =
    !tasksLoaded ||
    (taskList.filter((t) => t.completed).length === 0 &&
      Object.keys(priorities).length === 0 &&
      Object.keys(projects).length === 0 &&
      Object.keys(contexts).length === 0 &&
      Object.keys(fields).length === 0);

  const [tab, setTab] = React.useState<string>(
    hideFilter ? "settings" : "filter"
  );

  const handleChange = (event: any, newValue: string) => {
    setTab(newValue);
  };

  useEffect(() => {
    if (hideFilter) {
      setTab("settings");
    } else {
      setTab("filter");
    }
  }, [hideFilter]);

  return (
    <SwipeableDrawer
      aria-label="Menu"
      anchor="left"
      open={sideSheetOpen}
      onOpen={() => setSideSheetOpen(true)}
      onClose={() => setSideSheetOpen(false)}
    >
      <StyledPaper elevation={0} square>
        <TabContext value={tab}>
          <Box sx={{ flex: "none", borderBottom: 1, borderColor: "divider" }}>
            <SaveAreaHeader>
              <Tabs value={tab} onChange={handleChange}>
                {!hideFilter && <Tab label={t("Filter")} value="filter" />}
                <Tab label={t("Settings")} value="settings" />
              </Tabs>
            </SaveAreaHeader>
          </Box>
          <Box sx={{ overflowY: "auto", flex: "auto" }}>
            <SaveAreaContent>
              {!hideFilter && (
                <TabPanel value="filter">
                  <Filter />
                </TabPanel>
              )}
              <TabPanel value="settings">
                <Settings />
              </TabPanel>
            </SaveAreaContent>
          </Box>
        </TabContext>
      </StyledPaper>
    </SwipeableDrawer>
  );
};

export default SideSheet;
