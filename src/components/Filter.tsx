import { ChipList } from "@/components/ChipList";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FilterType, SortKey, useFilterStore } from "@/stores/filter-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useHotkeys } from "@/utils/useHotkeys";
import { useTask } from "@/utils/useTask";
import { HelpCircleIcon } from "lucide-react";
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

  useHotkeys({
    x: resetFilters,
  });

  return (
    <div className="space-y-4 text-sm">
      {Object.keys(priorities).length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold">{t("Priorities")}</div>
          <ChipList
            items={priorities}
            activeItems={activePriorities}
            onClick={togglePriority}
            color="danger"
          />
        </div>
      )}
      {Object.keys(projects).length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold">{t("Projects")}</div>
          <ChipList
            items={projects}
            activeItems={activeProjects}
            onClick={toggleProject}
            color="info"
          />
        </div>
      )}
      {Object.keys(contexts).length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold">{t("Contexts")}</div>
          <ChipList
            items={contexts}
            activeItems={activeContexts}
            onClick={toggleContext}
            color="success"
          />
        </div>
      )}
      {Object.keys(tags).length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold">{t("Tags")}</div>
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
        </div>
      )}
      {!defaultFilter && (
        <div className="flex justify-end">
          <Button
            className="px-0"
            variant="link"
            size="sm"
            onClick={resetFilters}
          >
            {t("Reset filters")}
          </Button>
        </div>
      )}
      {showSortBy && (
        <div className="space-y-2">
          <div className="font-semibold">{t("Filter type")}</div>
          <Select
            defaultValue="AND"
            value={filterType}
            onValueChange={(value) => setFilterType(value as FilterType)}
          >
            <SelectTrigger aria-label="Filter type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">{t("AND")}</SelectItem>
              <SelectItem value="OR">{t("OR")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {showSortBy && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 font-semibold">
            {t("Sort by")}
            {taskView === "timeline" && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <HelpCircleIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <Trans i18nKey="Disabled when timeline view is active" />
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <Select
            disabled={taskView === "timeline"}
            defaultValue="unsorted"
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortKey)}
          >
            <SelectTrigger aria-label="Sort tasks">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unsorted">{t("No sorting")}</SelectItem>
              <SelectItem value="priority">{t("Priority")}</SelectItem>
              <SelectItem value="dueDate">{t("Due Date")}</SelectItem>
              <SelectItem value="context">{t("Context")}</SelectItem>
              <SelectItem value="project">{t("Project")}</SelectItem>
              <SelectItem value="tag">{t("Tag")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <div className="font-semibold">{t("Status")}</div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hideCompletedTasks"
            checked={hideCompletedTasks}
            onCheckedChange={(event) => setHideCompletedTasks(event === true)}
            aria-label="Hide completed tasks"
          />
          <Label htmlFor="hideCompletedTasks">
            {t("Hide completed tasks")}
          </Label>
        </div>
      </div>
    </div>
  );
}
