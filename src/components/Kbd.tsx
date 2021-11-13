import { styled } from "@mui/material";
import React from "react";
import { usePlatform, useTouchScreen } from "../utils/platform";

export const StyledKbd = styled("kbd")`
  padding: 0 0.4em;
  opacity: 0.5;
  text-align: center;
  border: none;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  box-shadow: 0 0 0 1px grey;
`;

const Kbd: React.FC = ({ children }) => {
  const hasTouchScreen = useTouchScreen();
  const platform = usePlatform();

  if (hasTouchScreen || platform === "ios" || platform === "android") {
    return null;
  }

  return <StyledKbd>{children}</StyledKbd>;
};

export default Kbd;
