import { SearchInput } from "@/components/SearchInput";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Fade,
  IconButton,
  InputBaseProps,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { forwardRef, useRef, useState } from "react";

interface ExpandableSearchProps extends InputBaseProps {
  onExpand?: (expanded: boolean) => void;
}

export const ExpandableSearch = forwardRef<
  HTMLInputElement,
  ExpandableSearchProps
>((props, ref) => {
  const { value, onChange, onExpand } = props;
  const [showButton, setShowButton] = useState(!value);
  const [showInput, setShowInput] = useState(!!value);
  const containerRef = useRef<HTMLDivElement>();
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.down("sm"));

  const handleBlur = () => {
    if (!value) {
      setShowInput(false);
    }
  };

  const handleReset = () => {
    const input = (ref as any).current;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    nativeInputValueSetter?.call(input, "");

    const ev2 = new Event("input", { bubbles: true });
    input.dispatchEvent(ev2);

    setShowInput(false);
  };

  const handleEnteredInput = () => {
    const input = (ref as any).current;
    input.focus();
  };

  const handleExitedInput = () => {
    setShowButton(true);
    onExpand?.(false);
  };

  const handleExitButton = () => onExpand?.(true);

  const handleExitedButton = () => {
    setShowInput(true);
  };

  const input = (
    <SearchInput
      onChange={onChange}
      onBlur={handleBlur}
      onReset={handleReset}
      value={value}
      inputRef={ref}
    />
  );

  return (
    <>
      {!xs && <Box sx={{ display: "flex" }}>{input}</Box>}
      {xs && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
            alignItems: "center",
          }}
          ref={containerRef}
        >
          <Box sx={{ flex: 1 }}>
            <Fade
              in={showInput}
              unmountOnExit
              onEntered={handleEnteredInput}
              onExited={handleExitedInput}
            >
              <div>{input}</div>
            </Fade>
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <Fade
              in={showButton}
              unmountOnExit
              onExit={handleExitButton}
              onExited={handleExitedButton}
            >
              <IconButton
                size="large"
                color="inherit"
                aria-label="Expand search bar"
                onClick={() => setShowButton(false)}
              >
                <SearchIcon />
              </IconButton>
            </Fade>
          </Box>
        </Box>
      )}
    </>
  );
});
