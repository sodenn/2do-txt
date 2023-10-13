import { CloudStorageOnboarding } from "@/components/CloudStorageOnboarding";
import { ExampleFileButton } from "@/components/ExampleFileButton";
import { NewFileButton } from "@/components/NewFileButton";
import logo from "@/images/logo.png";
import { usePlatformStore } from "@/stores/platform-store";
import { useFilePicker } from "@/utils/useFilePicker";
import { useTask } from "@/utils/useTask";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Box, Button, Stack, styled, Typography } from "@mui/joy";
import { useTranslation } from "react-i18next";

const StyledBox = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingTop: theme.spacing(10),
  paddingBottom: theme.spacing(5),
  "@media screen and (max-height: 480px)": {
    paddingTop: 0,
    paddingBottom: 0,
  },
}));

export function Onboarding() {
  const { t } = useTranslation();
  const platform = usePlatformStore((state) => state.platform);
  const { taskLists } = useTask();
  const { openFileDialog } = useFilePicker();

  return (
    <StyledBox sx={{ display: taskLists.length === 0 ? "flex" : "none" }}>
      <Stack spacing={1}>
        <Box sx={{ py: 1, textAlign: "center" }}>
          <img
            src={logo}
            draggable={false}
            alt="Logo"
            height={96}
            style={{ opacity: 0.2 }}
          />
        </Box>
        <Typography
          sx={{ textAlign: "center" }}
          gutterBottom
          component="h1"
          level="h4"
          role="heading"
          aria-label="Onboarding"
        >
          {t("Get Started")}
        </Typography>
        <NewFileButton />
        <ExampleFileButton />
        <Button
          color="neutral"
          variant="outlined"
          component="span"
          fullWidth
          onClick={openFileDialog}
          aria-label={
            platform === "desktop" ? "Open todo.txt" : "Import todo.txt"
          }
          startDecorator={<FolderOpenIcon />}
        >
          {platform === "desktop" ? t("Open todo.txt") : t("Import todo.txt")}
        </Button>
        <CloudStorageOnboarding />
      </Stack>
    </StyledBox>
  );
}
