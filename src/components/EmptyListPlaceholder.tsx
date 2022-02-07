import InboxIcon from "@mui/icons-material/Inbox";
import { Box, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

const EmptyListPlaceholder = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mx: 2,
        mt: 5,
      }}
    >
      <InboxIcon color="disabled" fontSize="large" />
      <Typography sx={{ mt: 1 }} color="text.disabled">
        {t("No tasks")}
      </Typography>
    </Box>
  );
};

export default EmptyListPlaceholder;
