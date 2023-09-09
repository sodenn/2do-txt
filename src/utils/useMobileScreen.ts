import useMediaQuery from "@/utils/useMediaQuery";
import { useTheme } from "@mui/joy";

export function useMobileScreen() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("sm"));
}
