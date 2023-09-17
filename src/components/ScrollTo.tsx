import { Fade } from "@/components/Fade";
import { useIsInViewport } from "@/utils/useIsInViewport";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, IconButton, styled } from "@mui/joy";

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
          bottom: 16,
          right: { xs: 8, sm: 32 },
        }}
      >
        <IconButton
          tabIndex={-1}
          variant="soft"
          color="primary"
          aria-label="Scroll to"
        >
          {icon}
        </IconButton>
      </StyledBox>
    </Fade>
  );
}
