import { useBreakpoint } from "@/components/Breakpoint";

export function useMobileScreen() {
  const { currentBreakpoint } = useBreakpoint();
  return !currentBreakpoint;
}
