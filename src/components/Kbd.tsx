import { styled } from "@mui/material";

export const Kbd = styled("kbd")`
  margin-left: ${({ theme }) => theme.spacing(1)};
  padding: 0 0.4em;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  outline: 1px solid;
  opacity: 0.5;
  text-align: center;
`;
