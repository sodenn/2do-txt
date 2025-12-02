import { ArchivedTasksDialog } from "@/components/ArchivedTasksDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Header } from "@/components/Header";
import { LayoutContent } from "@/components/Layout";
import { Onboarding } from "@/components/Onboarding";
import { PrivateFilesystem } from "@/components/PrivateFilesystem";
import { SafeArea } from "@/components/SafeArea";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { SideSheet } from "@/components/SideSheet";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskView } from "@/components/TaskView";
import { useTaskEffect } from "@/utils/useTaskEffect";

export function Page() {
  useTaskEffect();
  return (
    <div className="sh:h-screen flex h-full flex-col outline-hidden">
      <Header />
      <SideSheet />
      <LayoutContent>
        <SafeArea right bottom left className="container" id="ptr-container">
          <div className="px-2 pt-1 sm:px-4 sm:pt-2">
            <TaskView />
            <Onboarding />
          </div>
        </SafeArea>
      </LayoutContent>
      <TaskDialog />
      <ConfirmationDialog />
      <ArchivedTasksDialog />
      <ShortcutsDialog />
      <PrivateFilesystem />
    </div>
  );
}
