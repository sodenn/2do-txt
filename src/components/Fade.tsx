import { PropsWithChildren, cloneElement } from "react";
import { Transition } from "react-transition-group";
import {
  TransitionProps,
  TransitionStatus,
} from "react-transition-group/Transition";

const duration = 250;

const defaultStyle = {
  transition: `opacity ${duration}ms ease-in-out`,
};

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
>;

export function Fade({ in: inProp, children, ...other }: FadeProps) {
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
