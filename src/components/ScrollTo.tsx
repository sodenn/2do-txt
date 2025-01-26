import { Fade } from "@/components/Fade";
import { SafeArea } from "@/components/SafeArea";
import { Button } from "@/components/ui/button";
import { useIsInViewport } from "@/utils/useIsInViewport";
import { ChevronDownIcon, ChevronsUpIcon } from "lucide-react";

interface ScrollTopProps {
  target: HTMLElement;
}

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
      <ChevronDownIcon className="h-4 w-4" />
    ) : direction === "below" ? (
      <ChevronsUpIcon className="h-4 w-4" />
    ) : null;

  return (
    <Fade in={!visible}>
      <SafeArea
        right
        bottom
        onClick={handleClick}
        className="fixed right-[16px] bottom-[16px] sm:right-[32px]"
      >
        <Button tabIndex={-1} size="icon" aria-label="Scroll to">
          {icon}
        </Button>
      </SafeArea>
    </Fade>
  );
}
