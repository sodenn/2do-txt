import { useFullScreenDialog } from "@/utils/useFullScreenDialog";

export function useDialogButtonSize() {
  const fullScreen = useFullScreenDialog();
  return fullScreen ? "sm" : "md";
}
