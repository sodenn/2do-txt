import { ChipList } from "@/components/ChipList";
import { FileList } from "@/components/FileList";
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
import { getTaskListAttributes } from "@/utils/task-list";
import { useHotkeys } from "@/utils/useHotkeys";
import { useTask } from "@/utils/useTask";
import { HelpCircleIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";

export function Filter() {
  const { t } = useTranslation();
  const { taskLists, selectedTaskLists } = useTask();
  const {
    sortBy,
    searchTerm,
    filterType,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedTags,
    hideCompletedTasks,
    setSortBy,
    setFilterType,
    togglePriority,
    setSelectedPriorities,
    setSelectedProjects,
    toggleProject,
    setSelectedContexts,
    toggleContext,
    setSelectedTags,
    toggleTag,
    setHideCompletedTasks,
    setSearchTerm,
    setSelectedTaskListIds,
  } = useFilterStore();
  const taskView = useSettingsStore((state) => state.taskView);
  const attributes = selectedTaskLists.length
    ? getTaskListAttributes(selectedTaskLists)
    : getTaskListAttributes(taskLists);
  const { priorities, projects, contexts, tags } = hideCompletedTasks
    ? attributes.incomplete
    : attributes;
  const showSortBy = taskLists.some((list) => list.items.length > 0);
  const defaultFilter = useMemo(
    () =>
      searchTerm === "" &&
      selectedContexts.length === 0 &&
      selectedProjects.length === 0 &&
      selectedTags.length === 0 &&
      selectedTaskLists.length === taskLists.length &&
      selectedPriorities.length === 0,
    [
      searchTerm,
      selectedContexts.length,
      selectedProjects.length,
      selectedTags.length,
      selectedTaskLists.length,
      taskLists.length,
      selectedPriorities.length,
    ],
  );

  const resetFilters = useCallback(() => {
    setSelectedProjects([]);
    setSelectedContexts([]);
    setSelectedTags([]);
    setSelectedPriorities([]);
    setSelectedTaskListIds([]);
    setSearchTerm("");
  }, [
    setSelectedContexts,
    setSelectedPriorities,
    setSelectedTaskListIds,
    setSelectedProjects,
    setSelectedTags,
    setSearchTerm,
  ]);

  useHotkeys({
    x: resetFilters,
  });

  return (
    <div className="space-y-4 text-sm">
      {Object.keys(priorities).length > 0 && (
        <div className="space-y-2">
          <Label className="flex justify-between">
            {t("Priorities")}
            {!defaultFilter && (
              <Button
                className="h-auto px-0"
                variant="link"
                size="sm"
                onClick={resetFilters}
              >
                {t("Reset filters")}
              </Button>
            )}
          </Label>
          <ChipList
            items={priorities}
            activeItems={selectedPriorities}
            onClick={togglePriority}
            color="danger"
          />
        </div>
      )}
      {!defaultFilter && Object.keys(priorities).length === 0 && (
        <Label className="flex justify-end">
          &nbsp;
          <Button
            className="h-auto px-0"
            variant="link"
            size="sm"
            onClick={resetFilters}
          >
            {t("Reset filters")}
          </Button>
        </Label>
      )}
      {Object.keys(projects).length > 0 && (
        <div className="space-y-2">
          <Label>{t("Projects")}</Label>
          <ChipList
            items={projects}
            activeItems={selectedProjects}
            onClick={toggleProject}
            color="info"
          />
        </div>
      )}
      {Object.keys(contexts).length > 0 && (
        <div className="space-y-2">
          <Label>{t("Contexts")}</Label>
          <ChipList
            items={contexts}
            activeItems={selectedContexts}
            onClick={toggleContext}
            color="success"
          />
        </div>
      )}
      {Object.keys(tags).length > 0 && (
        <div className="space-y-2">
          <Label>{t("Tags")}</Label>
          <ChipList
            items={Object.keys(tags).reduce<Record<string, number>>(
              (acc, key) => {
                acc[key] = tags[key].length;
                return acc;
              },
              {},
            )}
            activeItems={selectedTags}
            onClick={toggleTag}
            color="warning"
          />
        </div>
      )}
      <FileList />
      {showSortBy && (
        <div className="space-y-2">
          <Label>{t("Filter type")}</Label>
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
        <div className="flex flex-col-reverse gap-2">
          <Select
            disabled={taskView === "timeline"}
            defaultValue="unsorted"
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortKey)}
          >
            <SelectTrigger className="peer" aria-label="Sort tasks">
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
          <Label className="flex items-center gap-2">
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
          </Label>
        </div>
      )}
      <div className="space-y-2">
        <Label>{t("Status")}</Label>
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
