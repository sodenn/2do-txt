import { styled } from "@mui/material";
import React from "react";
import { usePlatform } from "../utils/platform";

export const StyledKbd = styled("kbd")`
  margin-left: ${({ theme }) => theme.spacing(1)};
  padding: 0 0.4em;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  outline: 1px solid;
  opacity: 0.5;
  text-align: center;
`;

const Kbd: React.FC = ({ children }) => {
  const platform = usePlatform();

  if (platform !== "web" && platform !== "electron") {
    return null;
  }

  return <StyledKbd>{children}</StyledKbd>;
};

export default Kbd;
