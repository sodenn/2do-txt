import { hasTouchScreen } from "@/native-api/platform";
import { usePlatformStore } from "@/stores/platform-store";
import { styled } from "@mui/material";
import { PropsWithChildren } from "react";

const StyledKbd = styled("kbd")(({ theme }) => ({
  padding: "0 0.4em",
  opacity: 0.5,
  textAlign: "center",
  fontWeight: 600,
  border: "none",
  borderRadius: theme.shape.borderRadius,
  boxShadow: `0 0 0 1px ${theme.palette.text.primary}`,
}));

export function Kbd({ children }: PropsWithChildren) {
  const touchScreen = hasTouchScreen();
  const platform = usePlatformStore((state) => state.platform);

  if (touchScreen || platform === "ios" || platform === "android") {
    return null;
  }

  return <StyledKbd>{children}</StyledKbd>;
}
