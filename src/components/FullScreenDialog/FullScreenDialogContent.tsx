import {
  addKeyboardDidHideListener,
  addKeyboardDidShowListener,
  removeAllKeyboardListeners,
} from "@/native-api/keyboard";
import { Box, styled } from "@mui/material";
import { PropsWithChildren, useEffect, useState } from "react";
import { useFullScreenDialog } from "./FullScreenDialogProvider";

const SafeArea = styled("div")({
  paddingRight: "env(safe-area-inset-right)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingBottom: "env(safe-area-inset-bottom)",
});

interface FullScreenDialogContentProps extends PropsWithChildren {
  disableGutters?: boolean;
}

export function FullScreenDialogContent(props: FullScreenDialogContentProps) {
  const { children, disableGutters } = props;
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const { setDivider } = useFullScreenDialog();

  useEffect(() => {
    if (root) {
      const listener = () => {
        setDivider(root.scrollTop > 12);
      };
      root.addEventListener("scroll", listener);
      return () => {
        root.removeEventListener("scroll", listener);
      };
    }
  }, [root, setDivider]);

  useEffect(() => {
    addKeyboardDidShowListener((info) => {
      root?.style.setProperty("padding-bottom", info.keyboardHeight + "px");
    });
    addKeyboardDidHideListener(() => {
      root?.style.removeProperty("padding-bottom");
    });
    return () => {
      removeAllKeyboardListeners();
    };
  }, [root]);

  return (
    <Box
      ref={setRoot}
      sx={{
        flex: "1 1 auto",
        position: "relative",
        overflowY: "auto",
        px: disableGutters ? 0 : 2,
        py: 1,
      }}
    >
      <SafeArea>{children}</SafeArea>
    </Box>
  );
}
