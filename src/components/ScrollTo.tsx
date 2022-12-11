import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, Fab, Fade } from "@mui/material";
import { useIsInViewport } from "../utils/useIsInViewport";

interface ScrollTopProps {
  target: HTMLElement;
}

const ScrollTo = ({ target }: ScrollTopProps) => {
  const { visible, direction } = useIsInViewport(target);

  const handleClick = () => {
    target.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  };

  const icon =
    direction === "above" ? (
      <KeyboardArrowDown />
    ) : direction === "below" ? (
      <KeyboardArrowUpIcon />
    ) : null;

  return (
    <Fade in={!visible}>
      <Box
        onClick={handleClick}
        sx={{
          position: "fixed",
          bottom: { xs: 16, sm: 24 },
          right: { xs: 4, sm: 24 },
        }}
      >
        <Fab
          color="primary"
          size="small"
          aria-label="Scroll to"
          sx={{ boxShadow: "unset" }}
        >
          {icon}
        </Fab>
      </Box>
    </Fade>
  );
};

export default ScrollTo;
