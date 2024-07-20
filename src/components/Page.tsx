import { ArchivedTasksDialog } from "@/components/ArchivedTasksDialog";
import { CloudFileDialog } from "@/components/CloudFileDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { FileCreateDialog } from "@/components/FileCreateDialog";
import { FileManagementDialog } from "@/components/FileManagementDialog";
import { FilePicker } from "@/components/FilePicker";
import { Header } from "@/components/Header";
import { LayoutContent } from "@/components/Layout";
import { Onboarding } from "@/components/Onboarding";
import { PageEffect } from "@/components/PageEffect";
import { SafeArea } from "@/components/SafeArea";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { SideSheet } from "@/components/SideSheet";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskView } from "@/components/TaskView";
import { WebDAVDialog } from "@/components/WebDAVDialog";

export function Component() {
  return (
    <FilePicker>
      <Header />
      <SideSheet />
      <LayoutContent>
        <SafeArea
          right
          bottom
          left
          className="container mx-auto"
          id="ptr-container"
        >
          <div className="px-2 pt-1 sm:px-4 sm:pt-2">
            <TaskView />
            <Onboarding />
          </div>
        </SafeArea>
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
