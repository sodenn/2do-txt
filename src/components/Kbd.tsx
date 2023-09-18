import { hasTouchScreen } from "@/native-api/platform";
import { usePlatformStore } from "@/stores/platform-store";
import { styled } from "@mui/joy";
import { PropsWithChildren } from "react";

const StyledKbd = styled("kbd")(({ theme }) => ({
  position: "relative",
  top: -1,
  padding: "3px 5px",
  marginLeft: 4,
  textAlign: "center",
  backgroundColor: theme.vars.palette.background.surface,
  border: `solid 1px ${theme.vars.palette.text.tertiary}`,
  borderBottomColor: theme.vars.palette.text.tertiary,
  borderRadius: 4,
  boxShadow: `inset 0 -1px 0 ${theme.vars.palette.text.tertiary}`,
  lineHeight: "1em",
  fontSize: "0.9em",
}));

export function Kbd({ children }: PropsWithChildren) {
  const touchScreen = hasTouchScreen();
  const platform = usePlatformStore((state) => state.platform);

  if (touchScreen || platform === "ios" || platform === "android") {
    return null;
  }

  return <StyledKbd>{children}</StyledKbd>;
}
