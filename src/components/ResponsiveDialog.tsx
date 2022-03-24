import { Dialog, styled } from "@mui/material";

export const ResponsiveDialog = styled(Dialog)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    "& .MuiPaper-root": {
      margin: theme.spacing(2),
      width: "100%",
    },
  },
}));
