import { Slot } from "@radix-ui/react-slot";
import { CSSProperties, forwardRef, HTMLAttributes } from "react";

interface SafeAreaProps extends HTMLAttributes<HTMLDivElement> {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
  asChild?: boolean;
}

function buildSafeAreaStyle(props: SafeAreaProps) {
  const style: CSSProperties = {};
  if (props.top) {
    style.paddingTop = "env(safe-area-inset-top)";
  }
  if (props.right) {
    style.paddingRight = "env(safe-area-inset-right)";
  }
  if (props.bottom) {
    style.paddingBottom = "env(safe-area-inset-bottom)";
  }
  if (props.left) {
    style.paddingLeft = "env(safe-area-inset-left)";
  }
  return style;
}

export const SafeArea = forwardRef<HTMLDivElement, SafeAreaProps>(
  ({ style, top, right, bottom, left, asChild, ...rest }, ref) => {
    const Comp = asChild ? Slot : "div";
    const safeAreaStyle = buildSafeAreaStyle({
      top,
      right,
      bottom,
      left,
    });
    return <Comp style={{ ...style, ...safeAreaStyle }} {...rest} ref={ref} />;
  },
);
