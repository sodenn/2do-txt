import { Fade } from "@/components/Fade";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { forwardRef, InputHTMLAttributes, useRef, useState } from "react";

export interface ExpandableSearchProps
  extends InputHTMLAttributes<HTMLInputElement> {
  onExpand?: (expanded: boolean) => void;
}

export const ExpandableSearch = forwardRef<
  HTMLInputElement,
  ExpandableSearchProps
>((props, ref) => {
  const { value, onChange, onExpand } = props;
  const [showButton, setShowButton] = useState(!value);
  const [showInput, setShowInput] = useState(!!value);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    if (!value) {
      setShowInput(false);
    }
  };

  const handleReset = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const input = (ref as any).current;

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    nativeInputValueSetter?.call(input, "");

    const ev = new Event("input", { bubbles: true });
    input.dispatchEvent(ev);

    setShowInput(false);
  };

  const handleEnteredInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      ref={ref}
    />
  );

  return (
    <>
      <div className="hidden sm:flex">{input}</div>
      <div className="flex flex-1 items-center sm:hidden" ref={containerRef}>
        <div className="flex-1">
          <Fade
            duration={150}
            in={showInput}
            unmountOnExit
            onEntered={handleEnteredInput}
            onExited={handleExitedInput}
          >
            <div>{input}</div>
          </Fade>
        </div>
        <div className="flex-shrink-0">
          <Fade
            in={showButton}
            unmountOnExit
            onExit={handleExitButton}
            onExited={handleExitedButton}
          >
            <Button
              tabIndex={-1}
              size="icon"
              variant="outline"
              aria-label="Expand search bar"
              onClick={() => setShowButton(false)}
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
          </Fade>
        </div>
      </div>
    </>
  );
});
