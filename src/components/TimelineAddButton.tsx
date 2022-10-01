import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import {
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { Box, Chip, IconButton } from "@mui/material";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useTaskDialog } from "../data/TaskDialogContext";
import { todayDate } from "../utils/date";
import { TimelineTask } from "../utils/task-list";

interface TimelineAddButtonProps {
  date?: Date;
  flags: TimelineTask["_timelineFlags"];
}

const YearChip = ({ date, flags }: TimelineAddButtonProps) => {
  return (
    <Box
      sx={{
        alignItems: "center",
        flexDirection: "column",
        display: {
          xs: "none",
          sm: "inline-flex",
        },
        visibility: flags.firstOfYear ? "visible" : "hidden",
        height: !flags.firstOfYear ? "1px" : undefined,
      }}
    >
      <Chip size="small" sx={{ my: 1 }} label={date && format(date, "yyyy")} />
      <TimelineConnector
        sx={{
          flexGrow: 0,
          pt: 2,
          bgcolor: "action.disabled",
        }}
      />
    </Box>
  );
};

const TimelineAddButton = ({ flags }: TimelineAddButtonProps) => {
  const { t } = useTranslation();
  const { setTaskDialogOptions } = useTaskDialog();

  const handleClick = () => setTaskDialogOptions({ open: true });

  return (
    <TimelineItem sx={{ minHeight: 0 }}>
      <TimelineOppositeContent
        sx={{
          flex: 0,
          pl: 0,
          pr: 1,
          pt: flags.first || flags.firstOfYear ? 9 : 2,
          display: {
            xs: "none",
            sm: "block",
          },
        }}
      >
        <Box
          sx={{
            width: 120,
            color: "info.main",
            fontWeight: "bold",
          }}
        >
          {t("Today")}
        </Box>
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineConnector
          sx={{
            bgcolor: "action.disabled",
            visibility: flags.first ? "hidden" : "visible",
          }}
        />
        <YearChip flags={flags} date={todayDate()} />
        <IconButton
          onClick={handleClick}
          sx={{ mx: 1, width: 38, height: 38 }}
          color="info"
        >
          <AddOutlinedIcon />
        </IconButton>
        <TimelineConnector
          sx={{
            bgcolor: flags.lastOfToday ? "action.disabled" : "info.main",
          }}
        />
      </TimelineSeparator>
      <TimelineContent
        sx={{
          cursor: "pointer",
          pb: 1,
          pt: { xs: 1, sm: flags.first || flags.firstOfYear ? 8 : 1 },
          px: { xs: 0, sm: 0.5 },
        }}
        onClick={handleClick}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            color: "info.main",
            fontWeight: "bold",
          }}
        >
          {t("Add task for today")}
        </Box>
      </TimelineContent>
    </TimelineItem>
  );
};

export default TimelineAddButton;
