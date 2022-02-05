import SearchIcon from "@mui/icons-material/Search";
import { Box, Fade, IconButton, InputBaseProps, Slide } from "@mui/material";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import SearchInput from "./SearchInput";

interface ExpandableSearchProps extends InputBaseProps {
  onExpand?: (expanded: boolean) => void;
}

const ExpandableSearch = forwardRef<HTMLInputElement, ExpandableSearchProps>(
  (props, ref) => {
    const { value, onChange, onExpand } = props;
    const [expanded, setExpanded] = useState(!!value);
    const containerRef = useRef<HTMLDivElement>();

    useEffect(() => onExpand && onExpand(expanded), [onExpand, expanded]);

    const handleBlur = () => {
      if (!value) {
        setExpanded(false);
      }
    };

    const handleReset = () => {
      const input = (ref as any).current;

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(input, "");

      const ev2 = new Event("input", { bubbles: true });
      input.dispatchEvent(ev2);

      setExpanded(false);
    };

    const handleExpand = () => {
      setExpanded(true);
      const input = (ref as any).current;
      setTimeout(() => {
        input.focus();
      }, 500);
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
        <Box sx={{ display: { xs: "none", md: "flex" } }}>{input}</Box>
        <Box
          sx={{
            flex: 1,
            display: { xs: "flex", md: "none" },
            overflow: "hidden",
            alignItems: "center",
          }}
          ref={containerRef}
        >
          <Box sx={{ flex: 1 }}>
            <Slide
              in={expanded}
              direction="left"
              container={containerRef.current}
              style={{ transitionDelay: expanded ? "225ms" : "0ms" }}
            >
              <div>{input}</div>
            </Slide>
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <Fade
              in={!expanded}
              unmountOnExit
              timeout={{ exit: 225, appear: 225 }}
              style={{
                transitionDelay: !expanded ? "225ms" : "0ms",
              }}
            >
              <IconButton
                size="large"
                color="inherit"
                aria-label="Expand search bar"
                onClick={handleExpand}
              >
                <SearchIcon />
              </IconButton>
            </Fade>
          </Box>
        </Box>
      </>
    );
  }
);

export default ExpandableSearch;
