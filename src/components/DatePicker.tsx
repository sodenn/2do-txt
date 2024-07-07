import { Calendar } from "@/components/ui/calendar";
import { DateInput } from "@/components/ui/date-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReactNode, useEffect, useState } from "react";
import { DayPickerSingleProps } from "react-day-picker";

interface DatePickerProps {
  value?: Date;
  onChange?: (date?: Date) => void;
  icon?: ReactNode;
}

export function DatePicker(props: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(props.value);
  const [month, setMonth] = useState(value);

  const handleClick: DateInput["onClick"] = (event) => {
    event.preventDefault();
    setOpen(true);
  };

  const handleChange: DateInput["onValueChange"] = (newDate) => {
    // @ts-ignore
    if (isNaN(newDate)) {
      setValue(undefined);
      setMonth(new Date());
    } else {
      setValue(newDate);
      props.onChange?.(newDate);
      setMonth(newDate);
    }
  };

  const handleSelect: DayPickerSingleProps["onSelect"] = (newDate) => {
    setValue(newDate);
    props.onChange?.(newDate);
    setOpen(false);
  };

  useEffect(() => {
    setValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.toLocaleDateString("en-US")]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DateInput
          onClick={handleClick}
          onValueChange={handleChange}
          value={value}
          icon={props.icon}
        />
      </PopoverTrigger>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-auto p-0"
        align="start"
      >
        <Calendar
          month={month}
          onMonthChange={setMonth}
          mode="single"
          selected={value}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
