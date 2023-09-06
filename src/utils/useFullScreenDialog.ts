import useMediaQuery from "@/utils/useMediaQuery";
import { useTheme } from "@mui/joy";

export function useFullScreenDialog() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("sm"));
}
