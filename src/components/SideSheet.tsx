import { Filter } from "@/components/Filter";
import { LayoutSidebar } from "@/components/Layout";
import { SafeArea } from "@/components/SafeArea";
import { Settings } from "@/components/Settings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useTask } from "@/utils/useTask";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function SideSheet() {
  const { t } = useTranslation();
  const { open: sideSheetOpen, closeSideSheet } = useSideSheetStore();
  const { taskLists, activeTaskList, ...rest } = useTask();

  const { priorities, projects, contexts, tags } = activeTaskList
    ? activeTaskList
    : rest;

  const completedTasksCount = activeTaskList
    ? activeTaskList.items.filter((task) => task.completed).length
    : taskLists.flatMap((list) => list.items).filter((t) => t.completed).length;

  const hideFilter =
    completedTasksCount === 0 &&
    Object.keys(priorities).length === 0 &&
    Object.keys(projects).length === 0 &&
    Object.keys(contexts).length === 0 &&
    Object.keys(tags).length === 0;

  const [tab, setTab] = useState<string>(hideFilter ? "settings" : "filter");

  useEffect(() => {
    if (hideFilter) {
      setTab("settings");
    } else {
      setTab("filter");
    }
  }, [hideFilter]);

  return (
    <LayoutSidebar open={sideSheetOpen} onClose={closeSideSheet}>
      <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
        <div className="px-3 pt-3">
          <SafeArea top left>
            {!hideFilter && (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filter" aria-label="Filter">
                  {t("Filter")}
                </TabsTrigger>
                <TabsTrigger value="settings" aria-label="Settings">
                  {t("Settings")}
                </TabsTrigger>
              </TabsList>
            )}
            {hideFilter && (
              <div className="px-2 py-3 font-semibold leading-none tracking-tight">
                {t("Filter")}
              </div>
            )}
          </SafeArea>
        </div>
        <ScrollArea>
          <SafeArea bottom left>
            <TabsContent className="px-3 pb-3 sm:px-5" value="filter">
              <Filter />
            </TabsContent>
            <TabsContent className="px-3 pb-3 sm:px-5" value="settings">
              <Settings />
            </TabsContent>
          </SafeArea>
        </ScrollArea>
      </Tabs>
    </LayoutSidebar>
  );
}
