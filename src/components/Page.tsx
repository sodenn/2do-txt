import { ArchivedTasksDialog } from "@/components/ArchivedTasksDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Header } from "@/components/Header";
import { LayoutContent } from "@/components/Layout";
import { Onboarding } from "@/components/Onboarding";
import { PageEffect } from "@/components/PageEffect";
import { PrivateFilesystem } from "@/components/PrivateFilesystem";
import { ReloadPrompt } from "@/components/ReloadPrompt";
import { SafeArea } from "@/components/SafeArea";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { SideSheet } from "@/components/SideSheet";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskView } from "@/components/TaskView";

export function Page() {
  return (
    <div className="sh:h-screen flex h-full flex-col outline-none">
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
      <ConfirmationDialog />
      <ArchivedTasksDialog />
      <ShortcutsDialog />
      <PrivateFilesystem />
      <PageEffect />
      <ReloadPrompt />
    </div>
  );
}
