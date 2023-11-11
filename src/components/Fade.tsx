import { PropsWithChildren, cloneElement, useMemo } from "react";
import { Transition } from "react-transition-group";
import {
  TransitionProps,
  TransitionStatus,
} from "react-transition-group/Transition";

const transitionStyles: Partial<Record<TransitionStatus, Record<string, any>>> =
  {
    entering: { opacity: 1 },
    entered: { opacity: 1 },
    exiting: { opacity: 0 },
    exited: { opacity: 0 },
  };

type FadeProps = Omit<
  PropsWithChildren<TransitionProps<HTMLDivElement>>,
  "addEndListener"
> & { duration?: number };

export function Fade({
  in: inProp,
  duration = 250,
  children,
  ...other
}: FadeProps) {
  const defaultStyle = useMemo(
    () => ({
      transition: `opacity ${duration}ms ease-in-out`,
    }),
    [duration],
  );
  return (
    <Transition in={inProp} timeout={duration} {...other}>
      {(state) =>
        cloneElement(children as any, {
          style: {
            ...defaultStyle,
            ...transitionStyles[state],
          },
        })
      }
    </Transition>
  );
}
