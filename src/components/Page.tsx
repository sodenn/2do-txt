import { ArchivedTasksDialog } from "@/components/ArchivedTasksDialog";
import { CloudFileDialog } from "@/components/CloudFileDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { DatePicker } from "@/components/DatePicker";
import { FileCreateDialog } from "@/components/FileCreateDialog";
import { FileManagementDialog } from "@/components/FileManagementDialog";
import { FilePicker } from "@/components/FilePicker";
import { Header } from "@/components/Header";
import { LayoutContent } from "@/components/Layout";
import { Onboarding } from "@/components/Onboarding";
import { PageEffect } from "@/components/PageEffect";
import { PriorityPicker } from "@/components/PriorityPicker";
import { RecurrencePicker } from "@/components/RecurrencePicker";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { SideSheet } from "@/components/SideSheet";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskView } from "@/components/TaskView";
import { WebDAVDialog } from "@/components/WebDAVDialog";
import { Container, styled } from "@mui/joy";
import { CalendarClockIcon, CalendarPlusIcon } from "lucide-react";

const SafeAreaContainer = styled(Container)(({ theme }) => ({
  paddingRight: "env(safe-area-inset-right)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingBottom: "env(safe-area-inset-bottom)",
  [theme.breakpoints.up("sm")]: {
    paddingTop: theme.spacing(1),
  },
  [theme.breakpoints.up("lg")]: {
    paddingTop: theme.spacing(2),
  },
}));

export function Component() {
  return (
    <FilePicker>
      <Header />
      <SideSheet />
      <LayoutContent>
        <SafeAreaContainer disableGutters id="ptr-container">
          <div className="flex gap-2">
            <PriorityPicker />
            <RecurrencePicker />
            <DatePicker icon={<CalendarPlusIcon className="h-4 w-4" />} />
            <DatePicker icon={<CalendarClockIcon className="h-4 w-4" />} />
          </div>
          <TaskView />
          <Onboarding />
        </SafeAreaContainer>
      </LayoutContent>
      <TaskDialog />
      <FileCreateDialog />
      <CloudFileDialog />
      <FileManagementDialog />
      <ConfirmationDialog />
      <ArchivedTasksDialog />
      <ShortcutsDialog />
      <WebDAVDialog />
      <PageEffect />
    </FilePicker>
  );
}
