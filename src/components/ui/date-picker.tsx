import { useBreakpoint } from "@/components/Breakpoint";
import { Button, ButtonProps } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatLocaleDate, isDateEqual } from "@/utils/date";
import { cn } from "@/utils/tw-utils";
import { useTooltip } from "@/utils/useTooltip";
import { CalendarIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { PropsSingle } from "react-day-picker";

interface DatePickerProps {
  value?: Date;
  onChange?: (date?: Date) => void;
  ariaLabel?: string;
  label?: ReactNode;
  tooltip?: ReactNode;
  locale?: string;
  icon?: ReactNode;
}

function formatDate(date?: Date, desktop?: boolean, locale?: string) {
  if (!date) {
    return null;
  }
  if (desktop) {
    return date.toLocaleString(locale, {
      day: "numeric",
      weekday: "short",
      month: "short",
      year: "numeric",
    });
  }
  return formatLocaleDate(date, locale);
}

export function DatePicker(props: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(props.value);
  const { showTooltip, ...tooltipProps } = useTooltip();
  const { isBreakpointActive } = useBreakpoint();
  const formatedDate = formatDate(date, isBreakpointActive("sm"), props.locale);

  const handleSelect: PropsSingle["onSelect"] = (date) => {
    setDate(date);
    props.onChange?.(date);
    setOpen(false);
  };

  const handleClick: ButtonProps["onClick"] = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (!isDateEqual(date, props.value)) {
      setDate(props.value);
    }
  }, [date, props.value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip open={showTooltip && !!props.tooltip && !open}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant={date ? "secondary" : "ghost"}
              size={date ? "default" : "icon"}
              aria-label={props.ariaLabel}
              onClick={handleClick}
              className={cn(
                "h-8 space-x-2",
                !date && "flex-shrink-0 text-muted-foreground",
                !!date && "justify-start text-left",
              )}
              {...tooltipProps}
            >
              {props.icon ? props.icon : <CalendarIcon className="h-4 w-4" />}
              {props.label && <span>{props.label}</span>}
              {formatedDate && <span>{formatedDate}</span>}
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>{props.tooltip}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          month={date}
          selected={date}
          onSelect={handleSelect}
          autoFocus
          showYearSwitcher
        />
      </PopoverContent>
    </Popover>
  );
}
