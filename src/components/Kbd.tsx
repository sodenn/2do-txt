import { styled } from "@mui/material";
import { WithChildren } from "../types/common";
import { getPlatform, hasTouchScreen } from "../utils/platform";

const StyledKbd = styled("kbd")(({ theme }) => ({
  padding: "0 0.4em",
  opacity: 0.5,
  textAlign: "center",
  fontWeight: 600,
  border: "none",
  borderRadius: theme.shape.borderRadius,
  boxShadow: `0 0 0 1px ${theme.palette.text.primary}`,
}));

const Kbd = ({ children }: WithChildren) => {
  const touchScreen = hasTouchScreen();
  const platform = getPlatform();

  if (touchScreen || platform === "ios" || platform === "android") {
    return null;
  }

  return <StyledKbd>{children}</StyledKbd>;
};

export default Kbd;
