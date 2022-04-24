import { Box, styled } from "@mui/material";
import React, { PropsWithChildren } from "react";

const SafeArea = styled("div")`
  padding-right: env(safe-area-inset-right);
  padding-left: env(safe-area-inset-left);
  padding-bottom: env(safe-area-inset-bottom);
`;

const FullScreenDialogContent = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Box
      sx={{
        flex: "1 1 auto",
        position: "relative",
        overflowY: "auto",
        px: 2,
        py: 1,
      }}
    >
      <SafeArea>{children}</SafeArea>
    </Box>
  );
};

export default FullScreenDialogContent;
