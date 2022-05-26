import {
  Dialog,
  DialogProps,
  Paper,
  PaperProps,
  Slide,
  SlideProps,
} from "@mui/material";
import { forwardRef } from "react";

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
    <Dialog
      sx={{ display: "flex", flexDirection: "column" }}
      fullScreen
      TransitionComponent={Transition}
      PaperComponent={PaperComponent}
      {...rest}
    >
      {children}
    </Dialog>
  );
};

export default FullScreenDialog;
