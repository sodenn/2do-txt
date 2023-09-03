interface CreateTransitions {
  easing?: Record<string, string>;
  duration?: Record<string, number | string>;
}

interface Options {
  duration?: number | string;
  easing?: string;
  delay?: number | string;
}

// Follow https://material.google.com/motion/duration-easing.html#duration-easing-natural-easing-curves
// to learn the context in which each easing should be used.
const easing = {
  // This is the most common easing curve.
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  // Objects enter the screen at full velocity from off-screen and
  // slowly decelerate to a resting point.
  easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
  // Objects leave the screen at full velocity. They do not decelerate when off-screen.
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  // The sharp curve is used by objects that may return to the screen at any time.
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
};

// Follow https://m2.material.io/guidelines/motion/duration-easing.html#duration-easing-common-durations
// to learn when use what timing
const duration = {
  shortest: 150,
  shorter: 200,
  short: 250,
  // most basic recommended timing
  standard: 300,
  // this is to be used in complex animations
  complex: 375,
  // recommended when something is entering screen
  enteringScreen: 225,
  // recommended when something is leaving screen
  leavingScreen: 195,
};

function formatMs(milliseconds: number) {
  return `${Math.round(milliseconds)}ms`;
}

function getAutoHeightDuration(height: number) {
  if (!height) {
    return 0;
  }
  const constant = height / 36;
  // https://www.wolframalpha.com/input/?i=(4+%2B+15+*+(x+%2F+36+)+**+0.25+%2B+(x+%2F+36)+%2F+5)+*+10
  return Math.round((4 + 15 * constant ** 0.25 + constant / 5) * 10);
}

function createTransitions(inputTransitions: CreateTransitions) {
  const mergedEasing = {
    ...easing,
    ...inputTransitions.easing,
  };

  const mergedDuration = {
    ...duration,
    ...inputTransitions.duration,
  };

  const create = (props = ["all"], options: Options = {}) => {
    const {
      duration: durationOption = mergedDuration.standard,
      easing: easingOption = mergedEasing.easeInOut,
      delay = 0,
    } = options;
    return (Array.isArray(props) ? props : [props])
      .map(
        (animatedProp) =>
          `${animatedProp} ${
            typeof durationOption === "string"
              ? durationOption
              : formatMs(durationOption)
          } ${easingOption} ${
            typeof delay === "string" ? delay : formatMs(delay)
          }`,
      )
      .join(",");
  };
  return {
    getAutoHeightDuration,
    create,
    ...inputTransitions,
    easing: mergedEasing,
    duration: mergedDuration,
  };
}

const transitions = createTransitions({});

export { transitions };
