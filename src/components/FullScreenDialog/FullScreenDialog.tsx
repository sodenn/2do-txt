import {
  Dialog,
  DialogProps,
  Paper,
  PaperProps,
  Slide,
  SlideProps,
} from "@mui/material";
import { forwardRef } from "react";
import { FullScreenDialogProvider } from "./FullScreenDialogProvider";

const Transition = forwardRef<HTMLCollection, SlideProps>(
  ({ children, ...rest }, ref) => {
    return (
      <Slide direction="up" ref={ref} {...rest}>
        {children}
      </Slide>
    );
  },
);

function PaperComponent(props: PaperProps) {
  return (
    <Paper {...props} elevation={8} sx={{ borderRadius: 0, boxShadow: 0 }} />
  );
}

export function FullScreenDialog({ children, ...other }: DialogProps) {
  return (
    <FullScreenDialogProvider>
      <Dialog
        sx={{ display: "flex", flexDirection: "column" }}
        fullScreen
        TransitionComponent={Transition}
        PaperComponent={PaperComponent}
        hideBackdrop={true}
        {...other}
      >
        {children}
      </Dialog>
    </FullScreenDialogProvider>
  );
}
