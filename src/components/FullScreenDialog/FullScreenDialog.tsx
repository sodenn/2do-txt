import {
  Dialog,
  DialogProps,
  Paper,
  PaperProps,
  Slide,
  SlideProps,
} from "@mui/material";
import { forwardRef } from "react";
import { FullScreenDialogProvider } from "./FullScreenDialogContext";

const Transition = forwardRef<HTMLCollection, SlideProps>(
  ({ children, ...rest }, ref) => {
    return (
      <Slide direction="up" ref={ref} {...rest}>
        {children}
      </Slide>
    );
  }
);

const PaperComponent = (props: PaperProps) => {
  return (
    <Paper {...props} elevation={8} sx={{ borderRadius: 0, boxShadow: 0 }} />
  );
};

const FullScreenDialog = ({ children, ...rest }: DialogProps) => {
  return (
    <FullScreenDialogProvider>
      <Dialog
        sx={{ display: "flex", flexDirection: "column" }}
        fullScreen
        TransitionComponent={Transition}
        PaperComponent={PaperComponent}
        {...rest}
      >
        {children}
      </Dialog>
    </FullScreenDialogProvider>
  );
};

export default FullScreenDialog;
