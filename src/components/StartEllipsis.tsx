import { styled, Typography, TypographyProps } from "@mui/material";
import { PropsWithChildren } from "react";

const Root = styled(Typography)`
  direction: rtl;
  text-align: left;
`;

const StartEllipsis = (props: PropsWithChildren<TypographyProps>) => {
  const { children, ...rest } = props;
  return (
    <Root noWrap {...rest}>
      <span style={{ unicodeBidi: "plaintext" }}>{children}</span>
    </Root>
  );
};

export default StartEllipsis;
