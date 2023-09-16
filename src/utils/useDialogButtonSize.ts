import { useMobileScreen } from "@/utils/useMobileScreen";

export function useDialogButtonSize() {
  const mobileScreen = useMobileScreen();
  return mobileScreen ? "sm" : "md";
}
