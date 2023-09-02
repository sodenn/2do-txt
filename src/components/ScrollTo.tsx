import { useIsInViewport } from "@/utils/useIsInViewport";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, Fab, Fade, styled } from "@mui/material";

interface ScrollTopProps {
  target: HTMLElement;
}

const StyledBox = styled(Box)({
  position: "fixed",
  paddingRight: "env(safe-area-inset-right)",
  paddingBottom: "env(safe-area-inset-bottom)",
});

export function ScrollTo({ target }: ScrollTopProps) {
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
      <StyledBox
        onClick={handleClick}
        sx={{
          bottom: { xs: 0, sm: 24 },
          right: { xs: 4, sm: 32 },
        }}
      >
        <Fab
          tabIndex={-1}
          color="primary"
          size="small"
          aria-label="Scroll to"
          sx={{ boxShadow: "unset" }}
        >
          {icon}
        </Fab>
      </StyledBox>
    </Fade>
  );
}
