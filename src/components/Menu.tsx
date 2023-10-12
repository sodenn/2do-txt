import { useForwardRef } from "@/utils/useForwardRef";
import { Menu as JoyMenu, MenuProps, styled } from "@mui/joy";
import { forwardRef } from "react";
import { createPortal } from "react-dom";

const Backdrop = styled("div")({
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: "var(--joy-zIndex-popup)",
});

export const Menu = forwardRef<HTMLDivElement, MenuProps>(
  ({ sx, ...other }, ref) => {
    const forwardedRef = useForwardRef(ref);
    return (
      <>
        {forwardedRef.current && createPortal(<Backdrop />, document.body)}
        <JoyMenu
          ref={forwardedRef}
          sx={{ zIndex: "calc(var(--joy-zIndex-popup) + 1)", ...sx }}
          {...other}
        />
      </>
    );
  },
);
