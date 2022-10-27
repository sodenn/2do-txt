import { Box, styled } from "@mui/material";
import { useEffect, useState } from "react";
import { WithChildren } from "../../types/common.types";

const SafeArea = styled("div")({
  paddingRight: "env(safe-area-inset-right)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingBottom: "env(safe-area-inset-bottom)",
});

interface FullScreenDialogContentProps extends WithChildren {
  onScroll?: (top: number) => void;
}

const FullScreenDialogContent = (props: FullScreenDialogContentProps) => {
  const { children, onScroll } = props;
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (root) {
      const listener = () => onScroll?.(root.scrollTop);
      root.addEventListener("scroll", listener);
      return () => {
        root.removeEventListener("scroll", listener);
      };
    }
  }, [onScroll, root]);

  return (
    <Box
      ref={setRoot}
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
